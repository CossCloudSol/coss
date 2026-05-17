import AdminLoginForm from './AdminLoginForm';

export default function AdminLoginPage(): JSX.Element {
  const hasAdminEmail = Boolean(process.env.ADMIN_EMAIL);
  return <AdminLoginForm hasAdminEmail={hasAdminEmail} />;
}
