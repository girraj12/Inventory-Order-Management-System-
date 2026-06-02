import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ total_products: 0, total_customers: 0, total_orders: 0, low_stock_products: 0 });
  const [message, setMessage] = useState('');
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', stock_quantity: '' });
  const [customerForm, setCustomerForm] = useState({ full_name: '', email: '', phone: '' });
  const [orderForm, setOrderForm] = useState({ customer_id: '', product_id: '', quantity: '' });

  const api = async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      let detail = 'Something went wrong';
      try { detail = (await res.json()).detail || detail; } catch {}
      throw new Error(Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : detail);
    }
    if (res.status === 204) return null;
    return res.json();
  };

  const load = async () => {
    try {
      const [p, c, o, s] = await Promise.all([
        api('/products'), api('/customers'), api('/orders'), api('/dashboard/summary')
      ]);
      setProducts(p); setCustomers(c); setOrders(o); setSummary(s);
    } catch (err) { setMessage(err.message); }
  };

  useEffect(() => { load(); }, []);

  const submitProduct = async (e) => {
    e.preventDefault();
    try {
      await api('/products', { method: 'POST', body: JSON.stringify({ ...productForm, price: Number(productForm.price), stock_quantity: Number(productForm.stock_quantity) }) });
      setProductForm({ name: '', sku: '', price: '', stock_quantity: '' });
      setMessage('Product created successfully');
      load();
    } catch (err) { setMessage(err.message); }
  };

  const submitCustomer = async (e) => {
    e.preventDefault();
    try {
      await api('/customers', { method: 'POST', body: JSON.stringify(customerForm) });
      setCustomerForm({ full_name: '', email: '', phone: '' });
      setMessage('Customer created successfully');
      load();
    } catch (err) { setMessage(err.message); }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    try {
      await api('/orders', { method: 'POST', body: JSON.stringify({ customer_id: Number(orderForm.customer_id), items: [{ product_id: Number(orderForm.product_id), quantity: Number(orderForm.quantity) }] }) });
      setOrderForm({ customer_id: '', product_id: '', quantity: '' });
      setMessage('Order created and stock reduced');
      load();
    } catch (err) { setMessage(err.message); }
  };

  const del = async (path) => {
    try { await api(path, { method: 'DELETE' }); setMessage('Deleted successfully'); load(); }
    catch (err) { setMessage(err.message); }
  };

  return <main>
    <header><h1>Inventory & Order Management</h1><p>Products, customers, orders and stock tracking</p></header>
    {message && <div className="message">{message}</div>}

    <section className="stats">
      <div><b>{summary.total_products}</b><span>Products</span></div>
      <div><b>{summary.total_customers}</b><span>Customers</span></div>
      <div><b>{summary.total_orders}</b><span>Orders</span></div>
      <div><b>{summary.low_stock_products}</b><span>Low Stock</span></div>
    </section>

    <section className="grid">
      <form onSubmit={submitProduct} className="card">
        <h2>Add Product</h2>
        <input required placeholder="Product name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}/>
        <input required placeholder="Unique SKU" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })}/>
        <input required type="number" min="0" step="0.01" placeholder="Price" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })}/>
        <input required type="number" min="0" placeholder="Stock quantity" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })}/>
        <button>Add Product</button>
      </form>

      <form onSubmit={submitCustomer} className="card">
        <h2>Add Customer</h2>
        <input required placeholder="Full name" value={customerForm.full_name} onChange={e => setCustomerForm({ ...customerForm, full_name: e.target.value })}/>
        <input required type="email" placeholder="Unique email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}/>
        <input required placeholder="Phone number" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}/>
        <button>Add Customer</button>
      </form>

      <form onSubmit={submitOrder} className="card">
        <h2>Create Order</h2>
        <select required value={orderForm.customer_id} onChange={e => setOrderForm({ ...orderForm, customer_id: e.target.value })}>
          <option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <select required value={orderForm.product_id} onChange={e => setOrderForm({ ...orderForm, product_id: e.target.value })}>
          <option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} - stock {p.stock_quantity}</option>)}
        </select>
        <input required type="number" min="1" placeholder="Quantity" value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })}/>
        <button>Create Order</button>
      </form>
    </section>

    <section className="list"><h2>Products</h2>{products.map(p => <article key={p.id}><span>{p.name} | SKU: {p.sku} | ₹{p.price} | Stock: {p.stock_quantity}</span><button onClick={() => del(`/products/${p.id}`)}>Delete</button></article>)}</section>
    <section className="list"><h2>Customers</h2>{customers.map(c => <article key={c.id}><span>{c.full_name} | {c.email} | {c.phone}</span><button onClick={() => del(`/customers/${c.id}`)}>Delete</button></article>)}</section>
    <section className="list"><h2>Orders</h2>{orders.map(o => <article key={o.id}><span>Order #{o.id} | Customer #{o.customer_id} | Total ₹{o.total_amount} | Items {o.items.length}</span><button onClick={() => del(`/orders/${o.id}`)}>Delete</button></article>)}</section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
