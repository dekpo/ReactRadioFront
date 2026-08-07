export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10 text-sm text-neutral-300">
      <h1 className="text-xl font-semibold text-white">
        Politique de confidentialité
      </h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white">
          Quelles données sont collectées ?
        </h2>
        <p>
          Quand tu te connectes avec Google, nous récupérons ton email, ton
          nom et ta photo de profil auprès de Google. Nous ne recevons
          jamais ton mot de passe. Quand tu likes un morceau, nous
          conservons son identifiant et son titre pour constituer ta
          playlist personnelle.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white">
          Pourquoi ces données ?
        </h2>
        <p>
          Uniquement pour te permettre de te connecter et de retrouver tes
          morceaux likés d'une session à l'autre. Ces données ne sont
          jamais partagées avec des tiers ni utilisées à des fins
          publicitaires.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white">
          Combien de temps sont-elles conservées ?
        </h2>
        <p>
          Tant que ton compte existe. Ta session de connexion expire
          automatiquement après une période d'inactivité.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white">
          Comment supprimer mes données ?
        </h2>
        <p>
          Depuis la Bibliothèque, une fois connecté, un bouton « Supprimer
          mon compte » supprime immédiatement et définitivement ton compte
          ainsi que tous tes morceaux likés.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white">Cookies</h2>
        <p>
          Le site utilise un unique cookie, strictement nécessaire pour te
          garder connecté. Il n'est pas utilisé à des fins de mesure
          d'audience ou de publicité, et n'est donc soumis à aucune
          bannière de consentement.
        </p>
      </section>
    </div>
  )
}
