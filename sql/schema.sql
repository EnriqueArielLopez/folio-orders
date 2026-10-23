PRAGMA foreign_keys = ON;

CREATE TABLE sales_order (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    region TEXT NOT NULL,
    created_at TEXT NOT NULL,
    due_at TEXT NOT NULL CHECK (due_at >= created_at),
    cancelled INTEGER NOT NULL DEFAULT 0 CHECK (cancelled IN (0, 1))
);

CREATE TABLE sales_order_item (
    order_id TEXT NOT NULL REFERENCES sales_order(id),
    material TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    delivered INTEGER NOT NULL CHECK (delivered BETWEEN 0 AND quantity),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
    PRIMARY KEY (order_id, material)
);

CREATE VIEW order_summary AS
SELECT o.id, o.customer, o.region, o.created_at, o.due_at, o.cancelled,
       SUM(i.quantity * i.unit_price_cents) AS total_cents,
       SUM(i.delivered * i.unit_price_cents) AS delivered_cents,
       SUM((i.quantity - i.delivered) * i.unit_price_cents) AS pending_cents,
       CASE WHEN o.cancelled = 1 THEN 'Cancelado'
            WHEN SUM(i.delivered) = 0 THEN 'Pendiente'
            WHEN SUM(i.delivered) = SUM(i.quantity) THEN 'Entregado'
            ELSE 'Parcial' END AS status
FROM sales_order o
JOIN sales_order_item i ON i.order_id = o.id
GROUP BY o.id, o.customer, o.region, o.created_at, o.due_at, o.cancelled;
