import { NextRequest, NextResponse } from "next/server";

/**
 * Protection de la beta par mot de passe, authentification HTTP Basic simple,
 * suffisante pour un usage interne. Le mot de passe vient de la variable
 * d'environnement BETA_PASSWORD, jamais du code. Si elle est absente (dev local),
 * l'acces est ouvert. Toutes les reponses portent noindex, la beta ne doit jamais
 * etre indexee.
 */
export function middleware(req: NextRequest) {
  const pass = process.env.BETA_PASSWORD;
  const deny = () =>
    new NextResponse("Acces reserve a la beta VIGIE.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="VIGIE beta", charset="UTF-8"',
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  if (pass) {
    const auth = req.headers.get("authorization");
    let ok = false;
    if (auth?.startsWith("Basic ")) {
      try {
        const [, pw] = atob(auth.slice(6)).split(":");
        ok = pw === pass;
      } catch {
        ok = false;
      }
    }
    if (!ok) return deny();
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // tout sauf les assets statiques de Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
