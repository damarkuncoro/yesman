import { promises as fs } from "fs";
import path from "path";

export interface DiscoveredRoute {
  path: string;
  method: string;
  filePath: string;
  feature?: string;
}

export class RouteScanner {
  constructor(
    private readonly apiBasePath: string = "src/app/api",
    private readonly defaultFeatureMap: Map<string, string> = new Map([
      ["/api/auth", "authentication"],
      ["/api/user", "user_management"],
      ["/api/users", "user_management"],
      ["/api/rbac", "rbac_management"],
      ["/api/roles", "role_management"],
      ["/api/features", "feature_management"],
      ["/api/dashboard", "dashboard"],
      ["/api/profile", "profile"],
      ["/api/admin", "admin_management"],
    ])
  ) {}

  async discoverRoutes(basePath?: string): Promise<DiscoveredRoute[]> {
    const scanPath = basePath || this.apiBasePath;
    const routes: DiscoveredRoute[] = [];

    if (!(await this.exists(scanPath))) {
      return routes;
    }

    await this.scanDirectory(scanPath, "", routes);
    return routes;
  }

  private async exists(dirPath: string): Promise<boolean> {
    try {
      await fs.access(dirPath);
      return true;
    } catch {
      return false;
    }
  }

  private async scanDirectory(
    dirPath: string,
    routePath: string,
    routes: DiscoveredRoute[]
  ): Promise<void> {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        if (item.name.startsWith("_") || item.name.startsWith(".")) continue;

        let segmentName = item.name;
        if (item.name.startsWith("[") && item.name.endsWith("]")) {
          segmentName = ":" + item.name.slice(1, -1);
        }

        const newRoutePath = routePath + "/" + segmentName;
        await this.scanDirectory(itemPath, newRoutePath, routes);
      } else if (item.name === "route.ts" || item.name === "route.js") {
        const apiPath = "/api" + routePath;
        const methods = await this.extractHttpMethods(itemPath);
        const feature = this.determineFeature(apiPath);

        for (const method of methods) {
          routes.push({
            path: apiPath,
            method,
            filePath: itemPath,
            feature,
          });
        }
      }
    }
  }

  private async extractHttpMethods(filePath: string): Promise<string[]> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const methods: string[] = [];

      const methodPatterns = [
        /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/g,
        /export\s+const\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*=/g,
      ];

      for (const pattern of methodPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (!methods.includes(match[1])) {
            methods.push(match[1]);
          }
        }
      }

      return methods.length > 0 ? methods : ["GET"];
    } catch {
      return ["GET"];
    }
  }

  private determineFeature(routePath: string): string {
    for (const [pathPrefix, feature] of this.defaultFeatureMap) {
      if (routePath.startsWith(pathPrefix)) {
        return feature;
      }
    }

    const segments = routePath.split("/").filter((s) => s.length > 0);
    if (segments.length >= 2) {
      return segments[1] + "_management";
    }

    return "general";
  }
}

export const routeScanner = new RouteScanner();