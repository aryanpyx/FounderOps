import { redirect } from "next/navigation";

// The custom non-streaming Ask page is retired — there's now a single chat: the
// real streaming Agent Chat. /ask stays as an endpoint that lands you in it.
export default function AskRedirect() {
  redirect("/dashboard");
}
