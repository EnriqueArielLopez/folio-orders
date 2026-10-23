"""Analizar el CSV de Folio con SQLite en memoria. No requiere dependencias."""
import argparse
import csv
import json
import sqlite3
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def analyze(path, cutoff="2026-10-22"):
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.executescript((ROOT / "sql/schema.sql").read_text(encoding="utf-8"))
    try:
        with path.open(encoding="utf-8-sig", newline="") as source:
            orders = {}
            for row in csv.DictReader(source):
                header = (row["pedido"], row["cliente"], row["region"], row["fecha"], row["compromiso"], int(row.get("cancelado", 0)))
                if row["pedido"] in orders and orders[row["pedido"]] != header:
                    raise ValueError("Las cabeceras del mismo pedido son diferentes.")
                if row["pedido"] not in orders:
                    connection.execute("INSERT INTO sales_order VALUES (?, ?, ?, ?, ?, ?)", header)
                    orders[row["pedido"]] = header
                cents = Decimal(row["precio_unitario"]) * 100
                if not cents.is_finite() or cents != cents.to_integral_value():
                    raise ValueError("Precio inválido o con más de dos decimales.")
                connection.execute("INSERT INTO sales_order_item VALUES (?, ?, ?, ?, ?, ?)", (row["pedido"], row["material"], row["descripcion"], int(row["cantidad"]), int(row["entregado"]), int(cents)))
        summary = connection.execute("""
            SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS booked,
                   COALESCE(SUM(pending_cents), 0) AS pending,
                   COALESCE(SUM(CASE WHEN due_at < ? AND pending_cents > 0 THEN 1 ELSE 0 END), 0) AS overdue
            FROM order_summary WHERE cancelled = 0
        """, (cutoff,)).fetchone()
        return dict(summary)
    finally:
        connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Consultar pedidos con el modelo SQL de Folio.")
    parser.add_argument("csv", type=Path)
    parser.add_argument("--cutoff", default="2026-10-22")
    args = parser.parse_args()
    try:
        print(json.dumps(analyze(args.csv, args.cutoff), ensure_ascii=False))
    except (ValueError, KeyError, OSError, sqlite3.Error, InvalidOperation) as error:
        parser.exit(2, f"No se pudo analizar: {error}\n")
