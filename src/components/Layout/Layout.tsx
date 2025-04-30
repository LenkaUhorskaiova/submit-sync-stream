
import { Outlet } from "react-router-dom";
import Header from "./Header";

const Layout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
