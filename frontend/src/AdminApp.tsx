import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8000";

function AdminLogin({ onLogin, error }: { onLogin: (u: string, p: string) => void, error: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="auth-bg">
      <h1 style={{
        color: '#ff9800',
        fontWeight: 700,
        fontSize: '3rem',
        textShadow: '2px 2px 0 #222',
        marginBottom: 32,
        letterSpacing: 1,
        textAlign: 'center',
      }}>
        AUB Mess Management System
      </h1>
      <div className="auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Admin Login</h2>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="primary-btn" onClick={() => onLogin(username, password)}>Login</button>
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}

function AdminNavBar({ tabs, selected, onSelect, onLogout }: { tabs: string[], selected: string, onSelect: (tab: string) => void, onLogout: () => void }) {
  return (
    <nav className="navbar">
      <div className="navbar-title">Admin Dashboard</div>
      <div className="navbar-links">
        {tabs.map(tab => (
          <button
            key={tab}
            className={selected === tab ? "nav-link active" : "nav-link"}
            onClick={() => onSelect(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <button className="logout-btn" onClick={onLogout}>Logout</button>
    </nav>
  );
}

function SectionTabs({ tabs, selected, onSelect }: { tabs: string[], selected: string, onSelect: (t: string) => void }) {
  return (
    <div className="admin-tabs">
      {tabs.map(tab => (
        <button key={tab} className={selected === tab ? "nav-link active" : "nav-link"} onClick={() => onSelect(tab)}>{tab}</button>
      ))}
    </div>
  );
}

function OrdersSection({ orders }: { orders: any[] }) {
  return (
    <div>
      <h3>Orders</h3>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Mess Pass</th><th>Items</th><th>Time</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.name}</td>
              <td>{o.mess_pass}</td>
              <td>{o.items}</td>
              <td>{o.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentsSection({ students }: { students: any[] }) {
  return (
    <div>
      <h3>Registered Students</h3>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Enrollment</th><th>Mess Pass</th><th>Registered At</th></tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.mess_pass}</td>
              <td>{s.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreOrdersSection({ preorders, onApprove, menu }: { preorders: any[], onApprove: (id: number, approve: boolean) => void, menu: any[] }) {
  // Helper to get item name by id
  const getItemName = (id: number) => menu.find((m) => m.id === id)?.name || `#${id}`;
  return (
    <div>
      <h3>Pre-Orders</h3>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Enrollment</th><th>Category</th><th>Items</th><th>Status</th><th>Time</th><th>Action</th></tr>
        </thead>
        <tbody>
          {preorders.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.enrollment}</td>
              <td>{p.category}</td>
              <td>{(() => {
                try {
                  const items = JSON.parse(p.items);
                  return items.map((it: any) => `${it.quantity}x ${getItemName(it.menu_item_id)}`).join(', ');
                } catch {
                  return p.items;
                }
              })()}</td>
              <td>{p.status}</td>
              <td>{p.created_at}</td>
              <td>
                {p.status === "pending" && (
                  <>
                    <button className="primary-btn" onClick={() => onApprove(p.id, true)}>Approve</button>
                    <button className="logout-btn" onClick={() => onApprove(p.id, false)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MenuSection({ menu, onSave }: { menu: any[], onSave: (m: any[]) => void }) {
  const [editMenu, setEditMenu] = useState(menu);
  const [newItem, setNewItem] = useState({ name: "", category: "", price: 0, image: "" });

  useEffect(() => { setEditMenu(menu); }, [menu]);

  const handleChange = (id: number, field: string, value: any) => {
    setEditMenu(m => m.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.price) {
      alert("Please fill in all fields.");
      return;
    }
    const newId = editMenu.length ? Math.max(...editMenu.map(item => item.id || 0)) + 1 : 1;
    setEditMenu([...editMenu, { ...newItem, id: newId }]);
    setNewItem({ name: "", category: "", price: 0, image: "" });
  };

  const categories = Array.from(new Set(editMenu.map(item => item.category).filter(Boolean)));

  return (
    <div>
      <h3>Edit Menu</h3>
      {categories.length === 0 ? (
        <p>No menu items found. Add a new item to get started.</p>
      ) : (
        categories.map((category, index) => (
          <div key={`category-${index}`}>
            <h4>{category}</h4>
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Price</th><th>Image</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {editMenu.filter(item => item.category === category).map(item => (
                  <tr key={`item-${item.id}`}>
                    <td>{item.id}</td>
                    <td>
                      <input
                        value={item.name}
                        onChange={e => handleChange(item.id, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => handleChange(item.id, "price", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        value={item.image}
                        onChange={e => handleChange(item.id, "image", e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="logout-btn"
                        onClick={() => setEditMenu(editMenu.filter(i => i.id !== item.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      <h4>Add New Item</h4>
      <div className="add-item-form">
        <select
          value={newItem.category}
          onChange={e => setNewItem({ ...newItem, category: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map((cat, index) => (
            <option key={`category-option-${index}`} value={cat}>{cat}</option>
          ))}
          <option value="new">Add New Category</option>
        </select>
        {newItem.category === "new" && (
          <input
            placeholder="New Category"
            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
          />
        )}
        <input
          placeholder="Name"
          value={newItem.name}
          onChange={e => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.price}
          onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
        />
        <input
          placeholder="Image URL"
          value={newItem.image}
          onChange={e => setNewItem({ ...newItem, image: e.target.value })}
        />
        <button className="primary-btn" onClick={handleAddItem}>Add Item</button>
      </div>
      <button className="primary-btn" onClick={() => onSave(editMenu)}>Save Menu</button>
    </div>
  );
}

function NavBar({ categories, selected, onSelect, onLogout }: { categories: string[], selected: string, onSelect: (cat: string) => void, onLogout: () => void }) {
  return (
    <nav className="navbar">
      <div className="navbar-title">CAMPUS MESS</div>
      <div className="navbar-links">
        {categories.map(cat => (
          <button
            key={cat}
            className={selected === cat ? "nav-link active" : "nav-link"}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        ))}
        <button
          className={selected === "Subscription" ? "nav-link active" : "nav-link"}
          onClick={() => onSelect("Subscription")}
        >
          Mess-Pass Subscription
        </button>
      </div>
      <button className="logout-btn" onClick={onLogout}>Logout</button>
    </nav>
  );
}

function SubscriptionPage({ currentSubscription, onSubscribe }: { currentSubscription: string, onSubscribe: (duration: string) => void }) {
  const [selectedDuration, setSelectedDuration] = useState(currentSubscription || "3");
  const [passGenerated, setPassGenerated] = useState(false);

  const costs = {
    "3": "₹4,500",
    "6": "₹8,000",
    "12": "₹15,000",
  };

  const handleSubscribe = () => {
    onSubscribe(selectedDuration);
    setPassGenerated(true);
  };

  const downloadPass = () => {
    const passDetails = `Mess-Pass Subscription\n\nDuration: ${selectedDuration} Months\nCost: ${costs[selectedDuration]}`;
    const blob = new Blob([passDetails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Mess-Pass.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (passGenerated) {
    return (
      <div className="subscription-page dark-bg">
        <h2>Your Mess-Pass</h2>
        <div className="pass-card">
          <h3>Mess-Pass Subscription</h3>
          <p>Duration: {selectedDuration} Months</p>
          <p>Cost: {costs[selectedDuration]}</p>
          <button className="primary-btn" onClick={downloadPass}>Download Pass</button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page dark-bg">
      <h2>Mess-Pass Subscription</h2>
      <p>Select your subscription duration:</p>
      <div className="subscription-options">
        <label className="subscription-card">
          <input
            type="radio"
            name="subscription"
            value="3"
            checked={selectedDuration === "3"}
            onChange={e => setSelectedDuration(e.target.value)}
          />
          <div className="subscription-content">
            <h3>3 Months</h3>
            <p>Cost: ₹4,500</p>
          </div>
        </label>
        <label className="subscription-card">
          <input
            type="radio"
            name="subscription"
            value="6"
            checked={selectedDuration === "6"}
            onChange={e => setSelectedDuration(e.target.value)}
          />
          <div className="subscription-content">
            <h3>6 Months</h3>
            <p>Cost: ₹8,000</p>
          </div>
        </label>
        <label className="subscription-card">
          <input
            type="radio"
            name="subscription"
            value="12"
            checked={selectedDuration === "12"}
            onChange={e => setSelectedDuration(e.target.value)}
          />
          <div className="subscription-content">
            <h3>12 Months</h3>
            <p>Cost: ₹15,000</p>
          </div>
        </label>
      </div>
      <button className="primary-btn" onClick={handleSubscribe}>Subscribe</button>
    </div>
  );
}

function LoginPage({ onLogin, switchToRegister }: { onLogin: (enrollment: string, password: string) => void, switchToRegister: () => void }) {
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <input
          placeholder="Enrollment Number"
          value={enrollment}
          onChange={e => setEnrollment(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="primary-btn"
          onClick={() => {
            if (!enrollment || !password) {
              setError("All fields required");
              return;
            }
            setError("");
            onLogin(enrollment, password);
          }}
        >
          Login
        </button>
        {error && <div className="error-msg">{error}</div>}
        <p>
          Don't have an account?{" "}
          <button className="link-btn" onClick={switchToRegister}>
            Register
          </button>
        </p>
        <p style={{ marginTop: 16 }}>
          <a href="/admin" style={{ color: '#1976d2', textDecoration: 'underline' }}>
            Admin Login
          </a>
        </p>
      </div>
    </div>
  );
}

function MessPassApplicationsSection({ students }: { students: any[] }) {
  return (
    <div>
      <h3>Mess-Pass Applications</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Enrollment</th>
            <th>Mess Pass</th>
            <th>Subscription Duration</th>
            <th>Status</th>
            <th>Applied At</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.mess_pass}</td>
              <td>
                {s.subscription_duration
                  ? `${s.subscription_duration} Months`
                  : "—"}
              </td>
              <td>
                {s.subscription_status === "cancelled"
                  ? <span style={{ color: "red" }}>Cancelled</span>
                  : s.subscription_status === "active"
                  ? <span style={{ color: "green" }}>Active</span>
                  : "—"}
              </td>
              <td>{s.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminApp() {
  const [auth, setAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("Orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [preorders, setPreorders] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [adminCreds, setAdminCreds] = useState<{ u: string; p: string } | null>(null);
  const tabs = ["Orders", "Menu", "Students", "Pre-Orders", "Mess-Pass Applications"]; // Removed "Subscription"

  // Helper for basic auth
  function authHeader(): Record<string, string> {
    if (!adminCreds) return {};
    return { Authorization: "Basic " + btoa(`${adminCreds.u}:${adminCreds.p}`) };
  }

  const fetchAll = () => {
    const headers = authHeader();
    fetch(`${API_URL}/orders`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then(setOrders)
      .catch((err) => console.error("Error fetching orders:", err)); // Debugging log

    fetch(`${API_URL}/admin/menu`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        console.log("Fetched menu data:", data); // Debugging log
        if (Array.isArray(data) && data.length > 0) {
          // Transform the menu data into a flat array of items with a `category` property
          const transformedMenu = data.flatMap((section) =>
            section.items.map((item) => ({ ...item, category: section.subcategory }))
          );
          console.log("Transformed menu data:", transformedMenu); // Debugging log
          setMenu(transformedMenu);
        } else {
          console.warn("Menu data is empty or invalid:", data); // Debugging log
          setMenu([]); // Fallback to an empty menu if data is invalid
        }
      })
      .catch((err) => {
        console.error("Error fetching menu:", err); // Debugging log
        setMenu([]); // Handle fetch errors
      });

    fetch(`${API_URL}/students`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then(setStudents)
      .catch((err) => console.error("Error fetching students:", err)); // Debugging log

    fetch(`${API_URL}/admin/preorders`, { headers, credentials: "include" })
      .then((r) => r.json())
      .then(setPreorders)
      .catch((err) => console.error("Error fetching preorders:", err)); // Debugging log
  };

  useEffect(() => {
    if (auth) {
      console.log("Fetching all data..."); // Debugging log
      fetchAll();
    }
  }, [auth]);

  const handleLogin = (u: string, p: string) => {
    console.log("Attempting admin login..."); // Debugging log
    fetch(`${API_URL}/admin/menu`, {
      headers: { Authorization: "Basic " + btoa(`${u}:${p}`) },
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          console.log("Admin login successful"); // Debugging log
          setAuth(true);
          setAdminCreds({ u, p });
          setAuthError("");
        } else {
          console.error("Admin login failed"); // Debugging log
          setAuthError("Invalid admin credentials");
        }
      })
      .catch((err) => {
        console.error("Error during admin login:", err); // Debugging log
        setAuthError("Login failed. Please try again.");
      });
  };

  const handleMenuSave = (newMenu: any[]) => {
    console.log("Saving menu:", newMenu); // Debugging log
    const headers = { ...authHeader(), "Content-Type": "application/json" };
    fetch(`${API_URL}/admin/menu`, {
      method: "POST",
      headers,
      body: JSON.stringify(newMenu),
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          console.log("Menu saved successfully"); // Debugging log
          setMenu(newMenu);
        } else {
          console.error("Failed to save menu"); // Debugging log
        }
      })
      .catch((err) => {
        console.error("Error saving menu:", err); // Debugging log
      });
  };

  const handleApprove = (id: number, approve: boolean) => {
    const headers = authHeader();
    fetch(`${API_URL}/admin/preorders/approve?id=${id}&approve=${approve}`, {
      method: "POST",
      headers,
      credentials: "include",
    }).then(() => fetchAll());
  };

  const handleLogout = () => {
    setAuth(false);
    setAdminCreds(null);
  };

  if (!auth) return <AdminLogin onLogin={handleLogin} error={authError} />;

  return (
    <div className="admin-app">
      <AdminNavBar tabs={tabs} selected={tab} onSelect={setTab} onLogout={handleLogout} />
      <div className="admin-section">
        {tab === "Orders" && <OrdersSection orders={orders} />}
        {tab === "Menu" && <MenuSection menu={menu} onSave={handleMenuSave} />}
        {tab === "Students" && <StudentsSection students={students} />}
        {tab === "Pre-Orders" && <PreOrdersSection preorders={preorders} onApprove={handleApprove} menu={menu} />}
        {tab === "Mess-Pass Applications" && <MessPassApplicationsSection students={students} />}
      </div>
    </div>
  );
}
