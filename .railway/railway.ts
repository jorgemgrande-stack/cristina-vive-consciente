import { defineRailway, github, project, service, volume } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "disciplined-courtesy";
export default defineRailway(() => {
  // Ficheros subidos desde el CRM (imágenes y PDF de las guías): nunca desmontar ni borrar
  const uploads = volume("disciplined-courtesy-volume", { sizeMB: 5000, region: "us-west2" });

  const disciplinedCourtesy = service("disciplined-courtesy", {
    source: github("jorgemgrande-stack/cristina-vive-consciente", { branch: "main", checkSuites: false }),
    build: "pnpm install && pnpm build",
    start: "pnpm start",
    // Railway guarda ON_FAILURE (su valor por defecto) como null: no declararlo evita un diff perpetuo
    deploy: { restartPolicyMaxRetries: 3 },
    replicas: { "us-west2": 1 },
    domains: ["cristinaviveconsciente.es", "www.cristinaviveconsciente.es"],
    volumeMounts: { "/app/uploads": uploads },
  });

  return project("Cristina ViveConsciente", {
    variables: { managed: false },
    resources: [disciplinedCourtesy, uploads],
  });
});
