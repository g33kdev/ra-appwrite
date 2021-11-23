import { Appwrite, AppwriteException, Models } from "appwrite";
import { AuthProvider, UserIdentity } from "ra-core";

const LocalStorageKey = {
  USER: "user",
  TEAMS: "teams",
};

export class AppwriteAuthProvider implements AuthProvider {
  client: Appwrite;

  constructor(client: Appwrite) {
    this.client = client;
  }

  // login: (params: any) => Promise<any>;
  async login(params: {
    username: string;
    password: string;
  }): Promise<Models.Session> {
    const { username, password } = params;

    const session = await this.client.account.createSession(username, password);
    const user = await this.client.account.get();
    localStorage.setItem(LocalStorageKey.USER, JSON.stringify(user));

    return session;
  }

  // logout: (params: any) => Promise<string | false | void>;
  async logout(): Promise<string | false | void> {
    try {
      await this.client.account.deleteSession("current");
      localStorage.removeItem(LocalStorageKey.USER);
      localStorage.removeItem(LocalStorageKey.TEAMS);
    } catch (err: unknown) {
      const code = (err as AppwriteException).code;
      if (code !== 401) {
        throw err;
      }
    }
  }

  // checkAuth: (params: any) => Promise<void>;
  async checkAuth(): Promise<void> {
    const localUser = localStorage.getItem(LocalStorageKey.USER);

    if (localUser) {
      return Promise.resolve();
    }

    try {
      const user = await this.client.account.get();

      localStorage.setItem(LocalStorageKey.USER, JSON.stringify(user));
      return Promise.resolve();
    } catch (err: unknown) {
      console.error(err);
      return Promise.reject({ message: "login.required" });
    }
  }

  // checkError: (error: any) => Promise<void>;
  async checkError(error: AppwriteException): Promise<void> {
    console.error(error);
    const { code } = error;
    if (code === 401 || code === 403) {
      localStorage.removeItem(LocalStorageKey.USER);
      return Promise.reject();
    }
    // other error code (404, 500, etc): no need to log out
    return Promise.resolve();
  }

  // getPermissions: (params: any) => Promise<any>;
  async getPermissions(): Promise<Models.TeamList> {
    let teams: Models.TeamList = {
      sum: 0,
      teams: [],
    };

    const localTeams = localStorage.getItem(LocalStorageKey.TEAMS);
    if (localTeams) {
      teams = JSON.parse(localTeams);
    } else {
      teams = await this.client.teams.list();
      localStorage.setItem(LocalStorageKey.TEAMS, JSON.stringify(teams));
    }

    return teams;
  }

  // getIdentity?: (() => Promise<UserIdentity>) | undefined;
  async getIdentity(): Promise<UserIdentity> {
    let user: Models.User<Models.Preferences> | null = null;

    const localUser = localStorage.getItem(LocalStorageKey.USER);
    if (localUser) {
      user = JSON.parse(localUser);
    } else {
      user = await this.client.account.get();
    }

    return {
      id: user?.$id || "",
      fullName: user?.name,
      // avatar: ''
      ...user,
    };
  }
}
