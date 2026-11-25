import { useAuth } from "../../hooks/useAuth";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-brand-gray">
      <header className="flex items-center justify-between bg-brand-forest px-6 py-5 text-white">
        <h1 className="text-xl font-bold">Enterprise Store</h1>
        <button onClick={logout} className="rounded-lg bg-white px-4 py-2 text-brand-forest">
          Sign Out
        </button>
      </header>

      <section className="p-8">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-2 text-brand-muted">
          Browse products, manage your cart and track your orders.
        </p>
        <p className="mt-4 text-sm text-brand-sage">Customer Portal</p>
      </section>
    </main>
  );
};

export default Home;
