/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(admin)` | `/(admin)/` | `/(admin)/assignments` | `/(admin)/attendance` | `/(admin)/batches` | `/(admin)/bulk-import` | `/(admin)/communication` | `/(admin)/fees` | `/(admin)/more` | `/(admin)/performance` | `/(admin)/reminders` | `/(admin)/settings` | `/(admin)/students` | `/(auth)` | `/(auth)/login` | `/(auth)/onboarding` | `/_sitemap` | `/assignments` | `/attendance` | `/batches` | `/bulk-import` | `/communication` | `/fees` | `/login` | `/more` | `/onboarding` | `/performance` | `/reminders` | `/settings` | `/students`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
