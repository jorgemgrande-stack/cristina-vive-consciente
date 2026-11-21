import type { AnchorHTMLAttributes } from "react";
import { Link } from "wouter";
import { isExternalUrl } from "@/lib/siteGlobal";
import { actionName } from "@shared/siteActions";
import { dispatchSiteAction } from "@/lib/siteActions";

/** Enlace editable: ruta de la web con navegación interna; http(s), correo, teléfono y anclas con <a>. */
export default function SiteLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const action = actionName(href);
  if (action) {
    return (
      <button type="button" onClick={() => dispatchSiteAction(action)} className={rest.className} style={rest.style} aria-label={rest["aria-label"]}>
        {children}
      </button>
    );
  }
  if (isExternalUrl(href) || href.startsWith("#")) {
    const blank = /^https?:/i.test(href);
    return (
      <a href={href} {...(blank ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
