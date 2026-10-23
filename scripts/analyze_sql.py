"""Analizar el CSV de Folio con SQLite en memoria. No requiere dependencias."""
import argparse
import csv
import json
import re
import sqlite3
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_SAFE_CENTS = 2**53 - 1
HEADERS = ("pedido", "cliente", "region", "fecha", "compromiso", "material", "descripcion", "cantidad", "precio_unitario", "entregado")


def analyze(path, cutoff="2026-10-22"):
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.executescript((ROOT / "sql/schema.sql").read_text(encoding="utf-8"))
    try:
        with path.open(encoding="utf-8-sig", newline="") as source:
            orders = {}
            order_totals = {}
            active_total = 0
            reader = csv.DictReader(source, strict=True)
            if not reader.fieldnames:
                raise ValueError("Falta la cabecera CSV.")
            reader.fieldnames = [name.strip() for name in reader.fieldnames]
            if len(set(reader.fieldnames)) != len(reader.fieldnames) or any(name not in reader.fieldnames for name in HEADERS):
                raise ValueError("La cabecera no coincide con la plantilla de Folio.")
            for row in reader:
                if None in row or any(value is None for value in row.values()):
                    raise ValueError("Una fila no tiene la misma cantidad de columnas que la cabecera.")
                quantity_text = row["cantidad"].strip()
                delivered_text = row["entregado"].strip()
                if not re.fullmatch(r"[0-9]+", quantity_text) or not re.fullmatch(r"[0-9]+", delivered_text):
                    raise ValueError("Las cantidades deben ser enteras no negativas.")
                quantity, delivered = int(quantity_text), int(delivered_text)
                if not 1 <= quantity <= 100000 or not 0 <= delivered <= quantity:
                    raise ValueError("Cantidad fuera de rango o entrega mayor al pedido.")
                price = row["precio_unitario"].strip()
                if not re.fullmatch(r"[0-9]{1,9}(?:\.[0-9]{1,2})?", price):
                    raise ValueError("Precio inválido: hasta nueve enteros y dos decimales, sin exponentes.")
                cents = int(Decimal(price) * 100)
                if cents <= 0:
                    raise ValueError("El precio debe ser mayor a cero.")
                header = (row["pedido"], row["cliente"], row["region"], row["fecha"], row["compromiso"], int(row.get("cancelado", 0)))
                if row["pedido"] in orders and orders[row["pedido"]] != header:
                    raise ValueError("Las cabeceras del mismo pedido son diferentes.")
                if row["pedido"] not in orders:
                    connection.execute("INSERT INTO sales_order VALUES (?, ?, ?, ?, ?, ?)", header)
                    orders[row["pedido"]] = header
                line_total = quantity * cents
                order_totals[row["pedido"]] = order_totals.get(row["pedido"], 0) + line_total
                if order_totals[row["pedido"]] > MAX_SAFE_CENTS:
                    raise ValueError("El importe del pedido excede el rango monetario seguro.")
                if not header[-1]:
                    active_total += line_total
                    if active_total > MAX_SAFE_CENTS:
                        raise ValueError("La suma del lote excede el rango monetario seguro.")
                connection.execute("INSERT INTO sales_order_item VALUES (?, ?, ?, ?, ?, ?)", (row["pedido"], row["material"], row["descripcion"], quantity, delivered, cents))
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
    except (ValueError, KeyError, OSError, csv.Error, sqlite3.Error, InvalidOperation) as error:
        parser.exit(2, f"No se pudo analizar: {error}\n")
