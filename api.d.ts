import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Conversation, ConversationInput, ConversationWithMessages, Document, DocumentInput, ErrorResponse, HealthStatus, ListDocumentsParams, MessageInput, UploadUrlRequest, UploadUrlResponse, VaultStats } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListDocumentsUrl: (params?: ListDocumentsParams) => string;
/**
 * @summary List all documents
 */
export declare const listDocuments: (params?: ListDocumentsParams, options?: RequestInit) => Promise<Document[]>;
export declare const getListDocumentsQueryKey: (params?: ListDocumentsParams) => readonly ["/api/documents", ...ListDocumentsParams[]];
export declare const getListDocumentsQueryOptions: <TData = Awaited<ReturnType<typeof listDocuments>>, TError = ErrorType<unknown>>(params?: ListDocumentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDocumentsQueryResult = NonNullable<Awaited<ReturnType<typeof listDocuments>>>;
export type ListDocumentsQueryError = ErrorType<unknown>;
/**
 * @summary List all documents
 */
export declare function useListDocuments<TData = Awaited<ReturnType<typeof listDocuments>>, TError = ErrorType<unknown>>(params?: ListDocumentsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDocuments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateDocumentUrl: () => string;
/**
 * @summary Register a newly uploaded document
 */
export declare const createDocument: (documentInput: DocumentInput, options?: RequestInit) => Promise<Document>;
export declare const getCreateDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDocument>>, TError, {
        data: BodyType<DocumentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDocument>>, TError, {
    data: BodyType<DocumentInput>;
}, TContext>;
export type CreateDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof createDocument>>>;
export type CreateDocumentMutationBody = BodyType<DocumentInput>;
export type CreateDocumentMutationError = ErrorType<unknown>;
/**
* @summary Register a newly uploaded document
*/
export declare const useCreateDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDocument>>, TError, {
        data: BodyType<DocumentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDocument>>, TError, {
    data: BodyType<DocumentInput>;
}, TContext>;
export declare const getGetDocumentStatsUrl: () => string;
/**
 * @summary Get vault statistics
 */
export declare const getDocumentStats: (options?: RequestInit) => Promise<VaultStats>;
export declare const getGetDocumentStatsQueryKey: () => readonly ["/api/documents/stats"];
export declare const getGetDocumentStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDocumentStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocumentStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDocumentStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDocumentStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDocumentStats>>>;
export type GetDocumentStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get vault statistics
 */
export declare function useGetDocumentStats<TData = Awaited<ReturnType<typeof getDocumentStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocumentStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDocumentUrl: (id: number) => string;
/**
 * @summary Get a single document
 */
export declare const getDocument: (id: number, options?: RequestInit) => Promise<Document>;
export declare const getGetDocumentQueryKey: (id: number) => readonly [`/api/documents/${number}`];
export declare const getGetDocumentQueryOptions: <TData = Awaited<ReturnType<typeof getDocument>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocument>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDocument>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDocumentQueryResult = NonNullable<Awaited<ReturnType<typeof getDocument>>>;
export type GetDocumentQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a single document
 */
export declare function useGetDocument<TData = Awaited<ReturnType<typeof getDocument>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDocument>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteDocumentUrl: (id: number) => string;
/**
 * @summary Delete a document
 */
export declare const deleteDocument: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteDocumentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
    id: number;
}, TContext>;
export type DeleteDocumentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDocument>>>;
export type DeleteDocumentMutationError = ErrorType<unknown>;
/**
* @summary Delete a document
*/
export declare const useDeleteDocument: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDocument>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDocument>>, TError, {
    id: number;
}, TContext>;
export declare const getExtractDocumentTextUrl: (id: number) => string;
/**
 * @summary Trigger text extraction for a document
 */
export declare const extractDocumentText: (id: number, options?: RequestInit) => Promise<Document>;
export declare const getExtractDocumentTextMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof extractDocumentText>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof extractDocumentText>>, TError, {
    id: number;
}, TContext>;
export type ExtractDocumentTextMutationResult = NonNullable<Awaited<ReturnType<typeof extractDocumentText>>>;
export type ExtractDocumentTextMutationError = ErrorType<unknown>;
/**
* @summary Trigger text extraction for a document
*/
export declare const useExtractDocumentText: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof extractDocumentText>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof extractDocumentText>>, TError, {
    id: number;
}, TContext>;
export declare const getQueryVaultUrl: () => string;
/**
 * @summary Query across all vault documents (SSE streaming)
 */
export declare const queryVault: (messageInput: MessageInput, options?: RequestInit) => Promise<string>;
export declare const getQueryVaultMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof queryVault>>, TError, {
        data: BodyType<MessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof queryVault>>, TError, {
    data: BodyType<MessageInput>;
}, TContext>;
export type QueryVaultMutationResult = NonNullable<Awaited<ReturnType<typeof queryVault>>>;
export type QueryVaultMutationBody = BodyType<MessageInput>;
export type QueryVaultMutationError = ErrorType<unknown>;
/**
* @summary Query across all vault documents (SSE streaming)
*/
export declare const useQueryVault: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof queryVault>>, TError, {
        data: BodyType<MessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof queryVault>>, TError, {
    data: BodyType<MessageInput>;
}, TContext>;
export declare const getListConversationsUrl: () => string;
/**
 * @summary List all chat conversations
 */
export declare const listConversations: (options?: RequestInit) => Promise<Conversation[]>;
export declare const getListConversationsQueryKey: () => readonly ["/api/chat/conversations"];
export declare const getListConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listConversations>>>;
export type ListConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List all chat conversations
 */
export declare function useListConversations<TData = Awaited<ReturnType<typeof listConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateConversationUrl: () => string;
/**
 * @summary Create a new conversation
 */
export declare const createConversation: (conversationInput: ConversationInput, options?: RequestInit) => Promise<Conversation>;
export declare const getCreateConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
        data: BodyType<ConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
    data: BodyType<ConversationInput>;
}, TContext>;
export type CreateConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createConversation>>>;
export type CreateConversationMutationBody = BodyType<ConversationInput>;
export type CreateConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a new conversation
*/
export declare const useCreateConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
        data: BodyType<ConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createConversation>>, TError, {
    data: BodyType<ConversationInput>;
}, TContext>;
export declare const getGetConversationUrl: (id: number) => string;
/**
 * @summary Get a conversation with its messages
 */
export declare const getConversation: (id: number, options?: RequestInit) => Promise<ConversationWithMessages>;
export declare const getGetConversationQueryKey: (id: number) => readonly [`/api/chat/conversations/${number}`];
export declare const getGetConversationQueryOptions: <TData = Awaited<ReturnType<typeof getConversation>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetConversationQueryResult = NonNullable<Awaited<ReturnType<typeof getConversation>>>;
export type GetConversationQueryError = ErrorType<unknown>;
/**
 * @summary Get a conversation with its messages
 */
export declare function useGetConversation<TData = Awaited<ReturnType<typeof getConversation>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteConversationUrl: (id: number) => string;
/**
 * @summary Delete a conversation
 */
export declare const deleteConversation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
    id: number;
}, TContext>;
export type DeleteConversationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteConversation>>>;
export type DeleteConversationMutationError = ErrorType<unknown>;
/**
* @summary Delete a conversation
*/
export declare const useDeleteConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteConversation>>, TError, {
    id: number;
}, TContext>;
export declare const getSendMessageUrl: (id: number) => string;
/**
 * @summary Send a message and get AI reply (streaming SSE)
 */
export declare const sendMessage: (id: number, messageInput: MessageInput, options?: RequestInit) => Promise<string>;
export declare const getSendMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        id: number;
        data: BodyType<MessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
    id: number;
    data: BodyType<MessageInput>;
}, TContext>;
export type SendMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendMessage>>>;
export type SendMessageMutationBody = BodyType<MessageInput>;
export type SendMessageMutationError = ErrorType<unknown>;
/**
* @summary Send a message and get AI reply (streaming SSE)
*/
export declare const useSendMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        id: number;
        data: BodyType<MessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendMessage>>, TError, {
    id: number;
    data: BodyType<MessageInput>;
}, TContext>;
export declare const getRequestUploadUrlUrl: () => string;
/**
 * @summary Request a presigned upload URL
 */
export declare const requestUploadUrl: (uploadUrlRequest: UploadUrlRequest, options?: RequestInit) => Promise<UploadUrlResponse>;
export declare const getRequestUploadUrlMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
        data: BodyType<UploadUrlRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
    data: BodyType<UploadUrlRequest>;
}, TContext>;
export type RequestUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestUploadUrl>>>;
export type RequestUploadUrlMutationBody = BodyType<UploadUrlRequest>;
export type RequestUploadUrlMutationError = ErrorType<unknown>;
/**
* @summary Request a presigned upload URL
*/
export declare const useRequestUploadUrl: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
        data: BodyType<UploadUrlRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
    data: BodyType<UploadUrlRequest>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map