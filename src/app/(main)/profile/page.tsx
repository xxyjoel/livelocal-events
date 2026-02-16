export default async function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">My Profile</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings and preferences.
      </p>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Account Information</h2>
        <div className="mt-4 space-y-4 text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-muted" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Name placeholder</p>
              <p className="text-sm">email@placeholder.com</p>
            </div>
          </div>
          <p>Profile editing form will go here</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Preferences</h2>
        <div className="mt-4 text-muted-foreground">
          <p>Notification and display preferences will go here</p>
        </div>
      </section>
    </div>
  );
}
