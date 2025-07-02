import { Hono } from "hono";
import { cors } from "hono/cors";
import { stytchBearerTokenAuthMiddleware } from "./lib/auth";
import { OKRAPI } from "./OKRAPI.ts";
import { OKRManagerMCP } from "./OKRManagerMCP.ts";

// Export the OKRManagerMCP class so the Worker runtime can find it
export { OKRManagerMCP };

export default new Hono<{ Bindings: Env }>()
	.use(cors())

	// Mount the API underneath us
	.route("/api", OKRAPI)

	// Serve the OAuth Authorization Server response for Dynamic Client Registration
	.get("/.well-known/oauth-protected-resource", async (c) => {
		const url = new URL(c.req.url);
		return c.json({
			resource: url.origin,
			authorization_servers: [c.env.STYTCH_DOMAIN],
		});
	})

	// Let the MCP Server have a go at handling the request
	.use("/sse/*", stytchBearerTokenAuthMiddleware)
	.route("/sse", new Hono().mount("/", OKRManagerMCP.mount("/sse").fetch))

	// Finally - serve static assets from Vite
	.mount("/", (req, env) => env.ASSETS.fetch(req));
