// Messages Firebase Auth traduits pour l'utilisateur.
export function authErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "E-mail ou mot de passe incorrect.";
    case "auth/user-disabled":
      return "Ce compte a été désactivé. Contactez un responsable communication.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    case "auth/network-request-failed":
      return "Connexion internet indisponible. Vérifiez votre réseau.";
    default:
      return "Connexion impossible. Réessayez dans un instant.";
  }
}
