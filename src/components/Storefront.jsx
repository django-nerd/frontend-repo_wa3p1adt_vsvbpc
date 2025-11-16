import { useEffect, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, addToCart }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {product.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <h3 className="mt-3 font-semibold text-gray-800 line-clamp-1">{product.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold">₹{product.price}</span>
        <button
          onClick={() => addToCart(product)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded"
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}

export default function Storefront() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/products`)
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id)
      if (exists) {
        return prev.map((p) => (p.id === product.id ? { ...p, qty: p.qty + 1 } : p))
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const placeOrder = async () => {
    if (cart.length === 0) return
    const orderPayload = {
      customer_name: 'Guest',
      customer_email: 'guest@example.com',
      customer_address: 'India',
      items: cart.map((c) => ({ product_id: c.id, quantity: c.qty })),
      total,
      status: 'pending',
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      if (!res.ok) throw new Error('Order failed')
      const data = await res.json()
      alert(`Order placed! ID: ${data.id}`)
      setCart([])
    } catch (e) {
      alert(e.message)
    }
  }

  const seed = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/seed-products`, { method: 'POST' })
      const data = await res.json()
      await fetchProducts()
      alert(`Seed: ${data.status}`)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">MyShop</h1>
          <div className="flex items-center gap-3">
            <button onClick={seed} className="text-sm px-3 py-1.5 rounded bg-gray-800 text-white">Seed Products</button>
            <div className="relative">
              <span className="font-medium">Cart ({cart.length})</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Products</h2>
            {loading && <span className="text-sm text-gray-500">Loading...</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} addToCart={addToCart} />
            ))}
          </div>
          {products.length === 0 && !loading && (
            <div className="text-center text-gray-600 mt-8">
              No products yet. Use Seed Products to add sample items.
            </div>
          )}
        </section>

        <aside className="bg-white rounded-xl shadow p-4 h-fit sticky top-20">
          <h3 className="text-lg font-semibold mb-3">Your Cart</h3>
          <div className="space-y-3">
            {cart.length === 0 && <p className="text-gray-500">Cart is empty</p>}
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium line-clamp-1">{item.title}</p>
                  <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">₹{item.price * item.qty}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-600 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">₹{total}</span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={placeOrder}
            className="mt-4 w-full bg-blue-600 disabled:bg-gray-300 text-white py-2 rounded"
          >
            Place Order
          </button>
        </aside>
      </main>
    </div>
  )
}
