import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import NewPasswordForm from "../../components/auth/NewPasswordForm";

export default function NewPassword() {
  return (
    <>
      <PageMeta
        title="New Password | Tally"
        description="Set a new password for your Tally account"
      />
      <AuthLayout>
        <NewPasswordForm />
      </AuthLayout>
    </>
  );
}
