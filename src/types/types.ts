export interface GithubActiveBranchesData {
  payload?: Payload;
  title?: string;
  appPayload?: AppPayload;
}

export interface AppPayload {
  repo?: Repo;
  createBranchButtonOptions?: CreateBranchButtonOptions;
  currentUser?: CurrentUser;
  enabledFeatures?: unknown;
}

export interface CreateBranchButtonOptions {
  branchListCacheKey?: string;
  repository?: Repo;
  repositoryParent?: null;
  createURL?: string;
  helpURL?: string;
}

export interface Repo {
  id?: number;
  defaultBranch?: string;
  name?: string;
  ownerLogin?: string;
  currentUserCanPush?: boolean;
  isFork?: boolean;
  isEmpty?: boolean;
  createdAt?: string;
  ownerAvatar?: string;
  public?: boolean;
  private?: boolean;
  isOrgOwned?: boolean;
}

export interface CurrentUser {
  login?: string;
  name?: string;
  avatarURL?: string;
  path?: string;
}

export interface Payload {
  currentPage?: number;
  hasMore?: boolean;
  perPage?: number;
  branches?: BranchesData[];
}

export interface BranchesData {
  name: string;
  isDefault?: boolean;
  mergeQueueEnabled?: boolean;
  path?: string;
  rulesetsPath?: null;
  protectedByBranchProtections?: boolean;
  author: CurrentUser;
  authoredDate?: string;
  deleteable?: boolean;
  deleteProtected?: boolean;
  isBeingRenamed?: boolean;
  renameable?: boolean;
  aheadBehind: [ahead: number, behind: number];
  pullRequest?: PullRequest | null;
}

export interface GithubActiveBranchesDeferredMetadata {
  deferredMetadata?: Record<string, DeferredMetadatum>;
}

export interface DeferredMetadatum {
  oid?: string;
  aheadBehind: [ahead: number, behind: number];
  maxDiverged?: number;
  statusCheckRollup?: StatusCheckRollup | null;
  pullRequest?: PullRequest | null;
  mergeQueue?: null;
  author?: null;
}

export interface PullRequest {
  number?: number;
  title?: string;
  state?: PullRequestState;
  reviewableState?: ReviewableState;
  merged?: boolean;
  permalink?: string;
  isPullRequest?: boolean;
}

export type ReviewableState = 'ready' | 'draft';

export type PullRequestState = 'closed' | 'open';

export interface StatusCheckRollup {
  state?: StatusCheckRollupState;
  shortText?: string;
}

export type StatusCheckRollupState = 'failure' | 'success';
