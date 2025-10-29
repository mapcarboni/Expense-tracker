import { AuthProvider } from '@/contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

export const metadata = {
  title: 'Expense Tracker',
  description: 'Smart expense tracking to help you save more and spend wisely',
  icons: {
    icon: '/icons/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </body>
    </html>
  );
}
