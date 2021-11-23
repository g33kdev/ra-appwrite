import {
  CreateParams,
  CreateResult,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyReferenceResult,
  GetManyResult,
  GetOneResult,
  Record,
  UpdateParams,
  UpdateResult,
  ValidUntil,
  DataProvider,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateManyParams,
  DeleteParams,
  DeleteManyParams,
  Identifier,
} from "ra-core";

import { Appwrite } from "appwrite";

export class AppwriteDataProvider implements DataProvider {
  client: Appwrite;
  resources: { [resource: string]: string };

  constructor(client: Appwrite, resources: { [resource: string]: string }) {
    this.client = client;
    this.resources = resources;
  }

  async getList<RecordType extends Record = Record>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const documentsList = await this.client.database.listDocuments(
      this.resources[resource],
      undefined,
      perPage,
      (page - 1) * perPage,
      field,
      order
    );

    const records = documentsList.documents.map((d) => {
      const { $id } = d;
      return {
        ...d,
        id: $id,
      };
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: records as any[],
      total: documentsList.sum,
    };
  }

  async getOne<RecordType extends Record = Record>(
    resource: string,
    params: GetOneParams
  ): Promise<GetOneResult<RecordType>> {
    const { id } = params;

    const document = await this.client.database.getDocument(
      this.resources[resource],
      `${id}`
    );

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { id: document.$id, ...document } as any,
    };
  }

  async getMany<RecordType extends Record = Record>(
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    const promises = params.ids.map((id) => {
      return this.client.database.getDocument(
        this.resources[resource],
        `${id}`
      );
    });

    const documents = await Promise.all(promises);

    const records = documents.map((d) => {
      const { $id } = d;
      return {
        id: $id,
        ...d,
      };
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: records as any[],
    };
  }

  async getManyReference<RecordType extends Record = Record>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    const { target, id, pagination, sort, filter } = params;

    const filters = [`${target}=${id}`];
    Object.keys(filter).forEach((key) => {
      filters.push(`${key}=${filter[key]}`);
    });

    const documentsList = await this.client.database.listDocuments(
      this.resources[resource],
      filters,
      pagination.perPage,
      pagination.page * pagination.perPage,
      sort.field,
      sort.order
    );

    const records = documentsList.documents.map((d) => {
      const { $id } = d;
      return {
        id: $id,
        ...d,
      };
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: records as any[],
      total: documentsList.sum,
    };
  }

  async update<RecordType extends Record = Record>(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    const {
      $id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      $collection: _$collection,
      $permissions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id,
      ...data
    } = params.data;

    const document = await this.client.database.updateDocument(
      this.resources[resource],
      $id,
      data,
      $permissions.read,
      $permissions.write
    );

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { id: $id, ...document } as any,
    };
  }

  async updateMany(
    resource: string,
    params: UpdateManyParams
  ): Promise<{
    data?: string[];
    validUntil?: ValidUntil;
  }> {
    const { ids, data } = params;
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      $id: _$id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      $collection: _$collection,
      $permissions,
      ...rest
    } = data;

    const promises = ids.map((id) => {
      return this.client.database.updateDocument(
        this.resources[resource],
        `${id}`,
        rest,
        $permissions.read,
        $permissions.write
      );
    });

    const documents = await Promise.all(promises);

    return {
      data: documents.map((d) => d.$id),
    };
  }

  async create<RecordType extends Record = Record>(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<RecordType>> {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      $id: _$id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      $collection: _$collection,
      $permissions,
      ...data
    } = params.data;

    const document = await this.client.database.createDocument(
      this.resources[resource],
      data,
      $permissions.read,
      $permissions.write
    );
    return {
      data: {
        id: document.$id,
        ...document,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    };
  }

  async delete<RecordType extends Record = Record>(
    resource: string,
    params: DeleteParams
  ): Promise<DeleteResult<RecordType>> {
    await this.client.database.deleteDocument(
      this.resources[resource],
      `${params.id}`
    );

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: params.previousData as any,
    };
  }

  async deleteMany(
    resource: string,
    params: DeleteManyParams
  ): Promise<{ data?: Identifier[] }> {
    const promises = params.ids.map((id) => {
      return this.client.database.deleteDocument(
        this.resources[resource],
        `${id}`
      );
    });

    await Promise.all(promises);

    return {
      data: params.ids,
    };
  }
}
