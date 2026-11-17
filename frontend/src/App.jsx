import { useState, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('libraryUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSignup, setIsSignup] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: '',
    status: 'Available'
  });
  const [editingId, setEditingId] = useState(null);
  const [bookError, setBookError] = useState('');

  const fetchBooks = async (searchQuery = '') => {
    try {
      const res = await fetch(`${API_URL}/books?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) setBooks(data);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBooks(search);
    }
  }, [user, search]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isSignup ? '/signup' : '/login';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || 'Authentication failed');
        return;
      }

      setUser(data.user);
      localStorage.setItem('libraryUser', JSON.stringify(data.user));
      setAuthForm({ name: '', email: '', password: '' });
    } catch {
      setAuthError('Cannot connect to server. Make sure backend is running.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('libraryUser');
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookError('');

    const url = editingId ? `${API_URL}/books/${editingId}` : `${API_URL}/books`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setBookError(data.message || 'Operation failed');
        return;
      }

      setBookForm({ title: '', author: '', category: '', status: 'Available' });
      setEditingId(null);
      fetchBooks(search);
    } catch {
      setBookError('Server error while saving book.');
    }
  };

  const startEdit = (book) => {
    setEditingId(book._id);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category,
      status: book.status
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBookForm({ title: '', author: '', category: '', status: 'Available' });
  };

  const toggleStatus = async (book) => {
    const newStatus = book.status === 'Available' ? 'Issued' : 'Available';
    try {
      const res = await fetch(`${API_URL}/books/${book._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...book, status: newStatus })
      });
      if (res.ok) fetchBooks(search);
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const deleteBook = async (id) => {
    try {
      const res = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBooks(search);
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  if (!user) {
    return (
      <div className="auth-card">
        <h2>{isSignup ? 'Library Sign Up' : 'Library Login'}</h2>
        {authError && <div className="error-msg">{authError}</div>}
        <form onSubmit={handleAuthSubmit}>
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            {isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>
        <button
          className="link-btn"
          onClick={() => {
            setIsSignup(!isSignup);
            setAuthError('');
          }}
        >
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="navbar">
        <h2>Book Library Management</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user.name}</span>
          <button className="btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Book' : 'Add New Book'}</h3>
        {bookError && <div className="error-msg" style={{ marginTop: '10px' }}>{bookError}</div>}
        <form onSubmit={handleBookSubmit} className="form-grid">
          <input
            type="text"
            placeholder="Book Title"
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Author"
            value={bookForm.author}
            onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Category (e.g. Fiction, CS)"
            value={bookForm.category}
            onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
            required
          />
          <select
            value={bookForm.status}
            onChange={(e) => setBookForm({ ...bookForm, status: e.target.value })}
          >
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
          </select>
          <div className="actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Book' : 'Add Book'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
          <h3>Library Catalog ({books.length})</h3>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No books found.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book._id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>
                    <span className={`badge ${book.status === 'Available' ? 'badge-available' : 'badge-issued'}`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-success" onClick={() => toggleStatus(book)}>
                      Mark {book.status === 'Available' ? 'Issued' : 'Available'}
                    </button>
                    <button className="btn-warning" onClick={() => startEdit(book)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => deleteBook(book._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
