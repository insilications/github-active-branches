import { isRepoRoot, utils } from 'github-url-detection';
// import memoize from 'memoize';
import GitHubFileURL from './github-file-url';
// import { configManager } from './config';
import { tempCache } from './caching';
// import type { CacheEntry } from './caching';

export const { getRepositoryInfo: getRepo, getCleanPathname } = utils;

// export const getUrl = memoize(async (currentUrl: string): Promise<string> => {
//   const defaultUrl = new GitHubFileURL(currentUrl);
//   if (isRepoRoot()) {
//     // The default branch of the root directory is just /user/repo/
//     defaultUrl.route = '';
//     defaultUrl.branch = '';
//   } else {
//     defaultUrl.branch = await getDefaultBranch();
//   }

//   return defaultUrl.href;
// });

// const getUrl = memoize(async (currentUrl: string): Promise<string> => {
// 	const defaultUrl = new GitHubFileURL(currentUrl);
// 	if (pageDetect.isRepoRoot()) {
// 		// The default branch of the root directory is just /user/repo/
// 		defaultUrl.route = '';
// 		defaultUrl.branch = '';
// 	} else {
// 		defaultUrl.branch = await getDefaultBranch();
// 	}

// 	return defaultUrl.href;
// });

export function getCachedDefaultBranch(currentUrl: string): string {
  const defaultUrl = new GitHubFileURL(currentUrl);
  if (isRepoRoot()) {
    console.log(`getCachedDefaultBranch 0`);
    // The default branch of the root directory is just /user/repo/
    defaultUrl.route = '';
    defaultUrl.branch = '';
  } else {
    const { defaultBranch } = tempCache.data;
    console.log(`getCachedDefaultBranch 1: ${defaultBranch}`);
    defaultUrl.branch = defaultBranch;
  }
  return defaultUrl.href;

  // const { owner, repo } = tempCache.data;
  // const cacheKey = `full-branch-data:${owner}/${repo}`;

  // let defaultBranch: string | null = null;

  // if (cache.has(cacheKey)) {
  //   const cached: CacheEntry | undefined = cache.get(cacheKey);
  //   if (cached && Date.now() - cached.timestamp < configManager.get('CACHE_DURATION')) {
  //     // return cached.data.defaultBranch;
  //     defaultBranch = cached.data.defaultBranch;
  //   }
  // }

  // const defaultUrl = new GitHubFileURL(currentUrl);

  // if (isRepoRoot()) {
  //   // The default branch of the root directory is just /user/repo/
  //   defaultUrl.route = '';
  //   defaultUrl.branch = '';
  //   return defaultUrl.href;
  // } else {
  //   if (defaultBranch) {
  //     defaultUrl.branch = defaultBranch;
  //     return defaultUrl.href;
  //   } else {
  //     return null; // No default branch cached
  //   }
  // }
}
