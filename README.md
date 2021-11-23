# ra-appwrite

This package provides a Data Provider and Auth Provider to integrate [Appwrite](https://appwrite.io/) with [react-admin](https://marmelab.com/react-admin).

The Data Provider supports:

- Documents

The Auth Provider supports:

- Login
- Logout
- Permissions (Teams)

## Installation

```sh
yarn add ra-appwrite
# or
npm install ra-appwrite
```

## Usage

```jsx
import React from "react";
import { Appwrite } from "appwrite";
import { AppwriteDataProvider, AppwriteAuthProvider } from "ra-appwrite";
import {
  Admin,
  EditGuesser,
  ListGuesser,
  Resource,
  ShowGuesser,
} from "react-admin";

// Init your Web SDK
const appwrite = new Appwrite();

appwrite
  .setEndpoint("http://localhost/v1") // Your Appwrite Endpoint
  .setProject("455x34dfkj"); // Your project ID

// Create a mapping of resources to collection IDs
const resources = {
  movies: "6160a2ca6b6fc",
};

// Initialize the providers
const dataProvider = new AppwriteDataProvider(appwrite, resources);
const authProvider = new AppwriteAuthProvider(appwrite);

const App = (): JSX.Element => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    <Resource
      name="movies" // Matches resources key
      list={ListGuesser}
      edit={EditGuesser}
      show={ShowGuesser}
    />
  </Admin>
);

export default App;
```

## Roadmap

- Add support for fetching teams
- Add support for fetching files
