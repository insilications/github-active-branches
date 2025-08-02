/// <reference types="@types/dom-navigation" />

declare module '*.gql' {
  const file: string;
  export default file;
}

type AnyObject = Record<string, unknown>;
