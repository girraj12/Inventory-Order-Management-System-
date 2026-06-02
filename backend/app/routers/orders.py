from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Customer, Order, OrderItem, Product
from ..schemas import OrderCreate, OrderOut

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    product_quantities: dict[int, int] = {}
    for item in payload.items:
        product_quantities[item.product_id] = product_quantities.get(item.product_id, 0) + item.quantity

    products = (
        db.query(Product)
        .filter(Product.id.in_(product_quantities.keys()))
        .with_for_update()
        .all()
    )
    product_map = {product.id: product for product in products}

    missing_ids = set(product_quantities.keys()) - set(product_map.keys())
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Product not found: {sorted(missing_ids)}")

    total_amount = Decimal("0.00")
    order = Order(customer_id=payload.customer_id, total_amount=0)
    db.add(order)
    db.flush()

    for product_id, quantity in product_quantities.items():
        product = product_map[product_id]
        if product.stock_quantity < quantity:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for SKU {product.sku}. Available: {product.stock_quantity}, requested: {quantity}",
            )
        line_total = Decimal(product.price) * quantity
        total_amount += line_total
        product.stock_quantity -= quantity
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
            line_total=line_total,
        ))

    order.total_amount = total_amount
    db.commit()
    return db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()

@router.get("", response_model=list[OrderOut])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).options(joinedload(Order.items)).order_by(Order.id.desc()).all()

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return None
