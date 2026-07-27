import { useEffect, useState } from "react";
import { Building2, Database, LayoutDashboard, MapPinned, MessageSquareText, Plus, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";
import { Navigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import { getAuthToken } from "../data/authStorage.js";

const emptyDestination = { id: "", name: "", capital: "", bestFor: "", about: "", dailyExpenses: 1800 };

export default function AdminPage({ user, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [destinationForm, setDestinationForm] = useState(emptyDestination);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const token = getAuthToken();

  async function api(path, options = {}) {
    const response = await fetch(`/api/admin${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Admin request failed");
    return data;
  }

  async function refresh() {
    setBusy(true);
    try {
      const [overview, userData, catalog, inquiryData] = await Promise.all([api("/overview"), api("/users"), api("/destinations"), api("/inquiries")]);
      setStats(overview.stats); setUsers(userData.users); setDestinations(catalog.destinations); setInquiries(inquiryData.inquiries);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  useEffect(() => { if (user?.role === "admin") refresh(); }, [user]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  async function importCatalog() {
    setBusy(true); setMessage("Importing the current travel catalog…");
    try { const data = await api("/import-catalog", { method: "POST" }); setMessage(data.message); await refresh(); }
    catch (error) { setMessage(error.message); setBusy(false); }
  }
  async function addDestination(event) {
    event.preventDefault();
    try { await api("/destinations", { method: "POST", body: JSON.stringify(destinationForm) }); setDestinationForm(emptyDestination); setMessage("Destination created"); await refresh(); }
    catch (error) { setMessage(error.message); }
  }
  async function removeDestination(id) { if (!window.confirm("Delete this destination and all its places and hotels?")) return; await api(`/destinations/${id}`, { method: "DELETE" }); setSelected(null); await refresh(); }
  async function openDetails(destination) { const data = await api(`/destinations/${destination.id}/details`); setSelected(data); }
  async function addPlace(event) { event.preventDefault(); const form = new FormData(event.currentTarget); await api("/places", { method: "POST", body: JSON.stringify({ destinationId: selected.destination.id, name: form.get("name"), city: form.get("city"), info: form.get("info"), mapUrl: form.get("mapUrl") }) }); event.currentTarget.reset(); await openDetails(selected.destination); await refresh(); }
  async function addHotel(event) { event.preventDefault(); const form = new FormData(event.currentTarget); await api("/hotels", { method: "POST", body: JSON.stringify({ destinationId: selected.destination.id, name: form.get("name"), area: form.get("area"), pricePerNight: form.get("price"), roomsAvailable: form.get("rooms"), rating: form.get("rating") }) }); event.currentTarget.reset(); await openDetails(selected.destination); await refresh(); }
  async function removeItem(type, id) { await api(`/${type}/${id}`, { method: "DELETE" }); await openDetails(selected.destination); await refresh(); }
  async function changeRole(account, role) { await api(`/users/${account.id}`, { method: "PATCH", body: JSON.stringify({ role }) }); await refresh(); }
  async function removeUser(account) { if (!window.confirm(`Delete ${account.email}?`)) return; await api(`/users/${account.id}`, { method: "DELETE" }); await refresh(); }
  async function changeInquiryStatus(inquiry, status) { await api(`/inquiries/${inquiry.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status } : item)); }

  const statCards = [["users", "Users", Users], ["destinations", "Destinations", MapPinned], ["places", "Places", LayoutDashboard], ["hotels", "Hotels", Building2], ["savedPlans", "Saved plans", ShieldCheck], ["inquiries", "Inquiries", MessageSquareText]];
  return <>
    <SiteHeader user={user} onLogout={onLogout} />
    <main className="admin-page" id="main-content">
      <aside className="admin-sidebar">
        <div><p>Tourgoater</p><h1>Admin control</h1></div>
        <nav>{[["overview", LayoutDashboard, "Overview"], ["users", Users, "Users"], ["inquiries", MessageSquareText, "Inquiries"], ["catalog", MapPinned, "Travel catalog"]].map(([key, Icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={18} />{label}</button>)}</nav>
        <button className="admin-refresh" onClick={refresh} disabled={busy}><RefreshCw size={17} /> Refresh data</button>
      </aside>
      <section className="admin-content">
        <header className="admin-top"><div><p className="eyebrow">Secure workspace</p><h2>{tab === "overview" ? "Dashboard overview" : tab === "users" ? "User access" : tab === "inquiries" ? "Booking inquiries" : "Destination database"}</h2></div><span><ShieldCheck size={17} /> {user.email}</span></header>
        {message && <p className="admin-message">{message}</p>}
        {tab === "overview" && <>
          <div className="admin-stat-grid">{statCards.map(([key,label,Icon]) => <article key={key}><Icon size={21}/><span>{label}</span><strong>{stats[key] ?? 0}</strong></article>)}</div>
          <section className="admin-import"><Database size={30}/><div><h3>Populate the Neon catalog</h3><p>Copy all current states, places and sample hotels into the production database. Existing records are updated safely.</p></div><button className="button" onClick={importCatalog} disabled={busy}>{busy ? "Working…" : "Import current catalog"}</button></section>
        </>}
        {tab === "users" && <div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Actions</th></tr></thead><tbody>{users.map((account) => <tr key={account.id}><td><strong>{account.name}</strong><small>{account.email}</small></td><td>{new Date(account.created_at).toLocaleDateString()}</td><td><select value={account.role} onChange={(e) => changeRole(account,e.target.value)} disabled={String(account.id)===String(user.id)}><option value="user">User</option><option value="admin">Admin</option></select></td><td><button className="admin-delete" onClick={() => removeUser(account)} disabled={String(account.id)===String(user.id)}><Trash2 size={16}/> Delete</button></td></tr>)}</tbody></table></div>}
        {tab === "inquiries" && <div className="admin-inquiry-list">{inquiries.length ? inquiries.map((inquiry) => <article className="admin-inquiry-card" key={inquiry.id}><header><div><span>Inquiry #{inquiry.id}</span><h3>{inquiry.destination_name}</h3><p>{new Date(inquiry.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div><select value={inquiry.status} onChange={(event) => changeInquiryStatus(inquiry, event.target.value)}><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></header><div className="admin-inquiry-grid"><dl><div><dt>Traveler</dt><dd>{inquiry.traveler_name}</dd></div><div><dt>Account</dt><dd>{inquiry.account_name}<small>{inquiry.account_email}</small></dd></div><div><dt>Phone</dt><dd><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></dd></div><div><dt>Email</dt><dd><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></dd></div></dl><dl><div><dt>Address</dt><dd>{inquiry.address}, {inquiry.city} - {inquiry.postal_code}</dd></div><div><dt>Overall total</dt><dd>₹{Number(inquiry.overall_total).toLocaleString("en-IN")}</dd></div><div><dt>User inquiry</dt><dd>{inquiry.inquiry || "No special requests"}</dd></div></dl></div></article>) : <div className="admin-select-empty"><MessageSquareText size={34}/><h3>No booking inquiries</h3><p>New customer booking requests will appear here.</p></div>}</div>}
        {tab === "catalog" && <div className="admin-catalog-layout">
          <div>
            <form className="admin-create-form" onSubmit={addDestination}><h3><Plus size={18}/> Add destination</h3><div><input placeholder="ID" value={destinationForm.id} onChange={e=>setDestinationForm({...destinationForm,id:e.target.value})} required/><input placeholder="State name" value={destinationForm.name} onChange={e=>setDestinationForm({...destinationForm,name:e.target.value})} required/><input placeholder="Capital" value={destinationForm.capital} onChange={e=>setDestinationForm({...destinationForm,capital:e.target.value})} required/></div><textarea placeholder="Description" value={destinationForm.about} onChange={e=>setDestinationForm({...destinationForm,about:e.target.value})}/><button className="button" type="submit">Create destination</button></form>
            <div className="admin-destination-list">{destinations.map(destination=><button key={destination.id} className={selected?.destination?.id===destination.id?"active":""} onClick={()=>openDetails(destination)}><span><strong>{destination.name}</strong><small>{destination.capital}</small></span><em>{destination.place_count} places · {destination.hotel_count} hotels</em></button>)}</div>
          </div>
          <div className="admin-detail-panel">{!selected ? <div className="admin-select-empty"><MapPinned size={34}/><h3>Select a destination</h3><p>Manage its places and hotel prices here.</p></div> : <><header><div><p>Destination {selected.destination.id}</p><h3>{selected.destination.name}</h3></div><button className="admin-delete" onClick={()=>removeDestination(selected.destination.id)}><Trash2 size={16}/> Delete state</button></header>
            <form className="admin-inline-form" onSubmit={addPlace}><h4>Add tourist place</h4><input name="name" placeholder="Place name" required/><input name="city" placeholder="City"/><textarea name="info" placeholder="Short description"/><input name="mapUrl" placeholder="Google Maps URL"/><button type="submit">Add place</button></form>
            <ul className="admin-item-list">{selected.places.map(item=><li key={item.id}><span><strong>{item.name}</strong><small>{item.city}</small></span><button onClick={()=>removeItem("places",item.id)}><Trash2 size={15}/></button></li>)}</ul>
            <form className="admin-inline-form" onSubmit={addHotel}><h4>Add hotel</h4><input name="name" placeholder="Hotel name" required/><input name="area" placeholder="Area"/><div><input name="price" type="number" min="0" placeholder="₹ per night" required/><input name="rooms" type="number" min="0" placeholder="Rooms"/><input name="rating" type="number" min="0" max="5" step=".1" placeholder="Rating"/></div><button type="submit">Add hotel</button></form>
            <ul className="admin-item-list">{selected.hotels.map(item=><li key={item.id}><span><strong>{item.name}</strong><small>₹{Number(item.price_per_night).toLocaleString("en-IN")} · {item.rooms_available} rooms</small></span><button onClick={()=>removeItem("hotels",item.id)}><Trash2 size={15}/></button></li>)}</ul>
          </>}</div>
        </div>}
      </section>
    </main>
  </>;
}
