import { User, Client, Service } from "@prisma/client";

export interface UserWithName extends User {
  name?: string;
}

export interface ClientWithEmail extends Client {
  email?: string;
}

export interface ServiceWithName extends Service {
  name?: string;
}
