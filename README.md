# Inventory & Order Management System

Full-stack assessment project using React, FastAPI, PostgreSQL, Docker and Docker Compose.

## Features

- Product CRUD
- Customer CRUD
- Order creation and listing
- Inventory validation
- Automatic stock reduction after order creation
- Unique product SKU
- Unique customer email
- Dashboard summary
- Responsive React UI
- PostgreSQL persistence using Docker named volume


## API Testing

Postman collection is available in the `postman` folder for testing all APIs.

## Tech Stack

- Backend: Python FastAPI
- Frontend: React + Vite
- Database: PostgreSQL
- Containerization: Docker
- Orchestration: Docker Compose

## Run with Docker

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

## Backend Local Run

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Frontend Local Run

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Health

```http
GET /health
```

### Products

```http
POST /products
GET /products
GET /products/{id}
PUT /products/{id}
DELETE /products/{id}
```

Create product body:

```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "price": 55000,
  "stock_quantity": 10
}
```

Update product body:

```json
{
  "name": "Gaming Laptop",
  "sku": "LAP-001",
  "price": 60000,
  "stock_quantity": 8
}
```

### Customers

```http
POST /customers
GET /customers
GET /customers/{id}
DELETE /customers/{id}
```

Create customer body:

```json
{
  "full_name": "Girraj Singhal",
  "email": "girraj@example.com",
  "phone": "9876543210"
}
```

### Orders

```http
POST /orders
GET /orders
GET /orders/{id}
DELETE /orders/{id}
```

Create order body:

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

### Dashboard

```http
GET /dashboard/summary
```

## Business Rules

- Product SKU must be unique.
- Customer email must be unique.
- Product quantity cannot be negative.
- Order quantity must be greater than zero.
- Order cannot be created if stock is insufficient.
- Order total amount is calculated by backend.
- Creating an order automatically reduces product stock.
- APIs return appropriate HTTP status codes and error messages.

## Deployment Notes

Recommended free platforms:

- Backend: Render, Railway or Fly.io
- Frontend: Vercel or Netlify
- Database: Render PostgreSQL, Railway PostgreSQL or Neon

Set these environment variables:

Backend:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
FRONTEND_ORIGIN=https://your-frontend-url.vercel.app
```

Frontend:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```
