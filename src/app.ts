/* eslint-disable no-var -- TypeScript weirdness */

import styleSheet from './style.css';
import { isRepoTree, isRepoRoot, is404 } from 'github-url-detection';
import type { RepositoryInfo } from 'github-url-detection';
import { getRepo, getCachedDefaultBranch } from './utils';
import type { CachedData, CacheEntry } from './caching';
// Initialize configuration manager
import { configManager } from './config';
// Initialize persistent and temporary cache
import { cache, tempCache } from './caching';
import type {
  GithubActiveBranchesData,
  BranchesData,
  GithubActiveBranchesDeferredMetadata,
} from './types/types';

var toDefaultBranchRegex = new RegExp(
  '^\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)(?:\/(?<middle>blob)\/(?<branch>.+)\/(?<rest>.+)?$|\/(?<middle>tree)\/(?<branch>.+)$)',
);
// Regex to accept parsing pathnames such as `/owner/repo/tree/feat/user-groups/api`
// var repoFromUrlRegex = new RegExp("^\/([^\/]+)\/([^\/]+)(?:\/tree|$)");
var repoFromUrlRegex = new RegExp('^\/([^\/]+)\/([^\/]+)');

/**
 * Creates the HTML table of active branches
 * @param {BranchesData[]} branchesData - Full branch data and the default branch
 * @param {string} defaultBranch - The default branch
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {string} - Complete HTML table
 */
function createActiveBranchesTable(
  branchesData: BranchesData[],
  defaultBranch: string,
  owner: string,
  repo: string,
): string {
  const pullRequestSvgClassDraft = 'octicon-git-pull-request-draft fWJxcW';
  const pullRequestSvgClassOpen = 'octicon-git-pull-request eMFpfy';
  const pullRequestSvgClassClosed = 'octicon-git-pull-request-closed dVRVeW';
  const pullRequestSvgClassMerged = 'octicon-git-merge hGcIaI';
  const pullRequestSvgDataDraft =
    'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z';
  const pullRequestSvgDataOpen =
    'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z';
  const pullRequestSvgDataClosed =
    'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z';
  const pullRequestSvgDataMerged =
    'M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z';
  const rows = branchesData
    .map(({ name, author, authoredDate, aheadBehind, pullRequest }) => {
      let prHTML = '';
      if (pullRequest) {
        const pullRequestNumber: number | undefined = pullRequest.number;
        let pullRequestSvgClass, pullRequestSvgData;

        if (pullRequest.merged) {
          pullRequestSvgClass = pullRequestSvgClassMerged;
          pullRequestSvgData = pullRequestSvgDataMerged;
        } else if (pullRequest.state === 'open') {
          if (pullRequest.reviewableState === 'draft') {
            pullRequestSvgClass = pullRequestSvgClassDraft;
            pullRequestSvgData = pullRequestSvgDataDraft;
          } else {
            pullRequestSvgClass = pullRequestSvgClassOpen;
            pullRequestSvgData = pullRequestSvgDataOpen;
          }
        } else {
          // pullRequest.state === "closed"
          pullRequestSvgClass = pullRequestSvgClassClosed;
          pullRequestSvgData = pullRequestSvgDataClosed;
        }

        prHTML = `
            <div class="Box-sc-g0xbh4-0 ibFJvP">
                <a
                class="Box-sc-g0xbh4-0 eIsNdH prc-Link-Link-85e08"
                data-muted="true"
                href="https://github.com/${owner}/${repo}/pull/${pullRequestNumber}"
                target="_blank"
                data-hovercard-url="/${owner}/${repo}/pull/${pullRequestNumber}/hovercard"
                ><span class="Box-sc-g0xbh4-0 dfAIjw prc-Label-Label--LG6X" data-size="small" data-variant="default"
                    ><div>
                    <svg
                        aria-hidden="true"
                        focusable="false"
                        class="octicon ${pullRequestSvgClass} Octicon-sc-9kayk9-0"
                        viewBox="0 0 16 16"
                        width="14"
                        height="14"
                        fill="currentColor"
                        display="inline-block"
                        overflow="visible"
                        style="vertical-align: text-bottom"
                    >
                        <path
                        d="${pullRequestSvgData}"
                        ></path>
                    </svg>
                    </div>
                    <span class="Box-sc-g0xbh4-0 gHzkdx prc-Text-Text-0ima0">#${pullRequestNumber}</span></span
                ></a
                >
            </div>`;
      }

      let dateDisplay = '';
      let dateTitle = '';
      let dateAttr = '';
      if (authoredDate) {
        dateAttr = authoredDate;
        dateTitle = new Date(authoredDate).toLocaleString();
        dateDisplay = formatDate(authoredDate);
      } else {
        dateAttr = new Date().toISOString();
        dateTitle = 'Date unavailable';
        dateDisplay = 'Unknown';
      }

      return `
        <tr class="TableRow prc-DataTable-TableRow-1vLX7" role="row">
            <td class="TableCell prc-DataTable-TableCell-dVc-6" role="cell">
                <div class="Box-sc-g0xbh4-0 iLdDOk">
                    <a href="/${owner}/${repo}/tree/${encodeURIComponent(name)}" class="prc-BranchName-BranchName-jFtg-">
                        <div class="prc-Truncate-Truncate-A9Wn6" style="--truncate-max-width: 540px">
                            ${escapeHtml(name)}
                        </div>
                    </a>
                </div>
            </td>
            <td class="TableCell prc-DataTable-TableCell-dVc-6" role="cell">
                <div class="Box-sc-g0xbh4-0 ibFJvP">
                    <div class="Box-sc-g0xbh4-0 hKWjvQ">
                        <a
                        class="Box-sc-g0xbh4-0 kYLlPM prc-Link-Link-85e08"
                        href="${author.path}"
                        data-hovercard-url="/users/${author.login}/hovercard"
                        ><img
                            data-component="Avatar"
                            class="Box-sc-g0xbh4-0 edRbzn prc-Avatar-Avatar-ZRS-m"
                            alt="${author.login}"
                            width="16"
                            height="16"
                            src="${author.avatarURL}"
                            data-testid="github-avatar"
                            aria-label="${author.login}"
                            style="--avatarSize-regular: 16px"
                        /></a>
                        <relative-time class="sc-aXZVg" tense="past" datetime="${dateAttr}"
                                     title="${dateTitle}">
                            ${escapeHtml(dateDisplay)}
                        </relative-time>
                    </div>
                </div>
            </td>
            <td class="TableCell prc-DataTable-TableCell-dVc-6" role="cell">
                <div class="Box-sc-g0xbh4-0 eEJBwi branch-a-b-count" role="img">
                    <span role="tooltip" class="Tooltip__TooltipBase-sc-17tf59c-0 fiSvBN tooltipped-n"
                          aria-label="${aheadBehind[1]} behind, ${aheadBehind[0]} ahead">
                        <div class="Box-sc-g0xbh4-0 gFwfBq">
                            <div class="Box-sc-g0xbh4-0 dQfiHF">
                                <div class="Box-sc-g0xbh4-0 bHKmtK">${aheadBehind[1]}</div>
                            </div>
                            <div class="Box-sc-g0xbh4-0 itKkCL" style="position: relative; width: 50%; padding-bottom: 4px; text-align: left; border-left-width: 1px; border-left-style: solid; border-color: var(--borderColor-default,var(--color-border-default,#30363d));">
                                <div class="Box-sc-g0xbh4-0 bHKmtK">${aheadBehind[0]}</div>
                            </div>
                        </div>
                    </span>
                </div>
            </td>
            <td class="TableCell prc-DataTable-TableCell-dVc-6" role="cell">
                ${prHTML}
            </td>
        </tr>`;
    })
    .join('');

  return `
    <div
    class="Box-sc-g0xbh4-0 hdShgm TableOverflowWrapper prc-DataTable-TableOverflowWrapper-PFgsy"
    id="userscript-branches-table"
    >
    <div
        style="padding-left: 16px; padding-right: 16px; padding-bottom: 12px;"
    >
        <a class="color-fg-default" style="margin: 0; font-size: 16px; font-weight: 600" href="/${owner}/${repo}/branches/active">
        Active Branches
        </a>
        <p style="margin: 4px 0 0; font-size: 12px; color: #656d76">
        Latest ${branchesData.length} branches sorted by most recent update (excluding default branch ${defaultBranch})
        </p>
    </div>
    <table
    data-cell-padding="normal"
    class="Table prc-DataTable-Table-qYfrL"
    role="table"
    style="
        --grid-template-columns: minmax(max-content, 1fr) 180px 150px 125px;
        outline: none;
    "
    >
    <thead
        class="TableHead prc-DataTable-TableHead-eOrJU"
        role="rowgroup"
        style="outline: none"
    >
        <tr
        class="TableRow prc-DataTable-TableRow-1vLX7"
        role="row"
        style="outline: none"
        >
        <th
            class="TableHeader prc-DataTable-TableHeader-CRPoj"
            role="columnheader"
            scope="col"
            style="outline: none"
        >
            Branch
        </th>
        <th
            class="TableHeader prc-DataTable-TableHeader-CRPoj"
            role="columnheader"
            scope="col"
            style="outline: none"
        >
            Updated
        </th>
        <th
            class="TableHeader prc-DataTable-TableHeader-CRPoj"
            role="columnheader"
            scope="col"
            style="outline: none"
        >
            <div class="Box-sc-g0xbh4-0 hyUedm" style="outline: none">
            <span
                class="Box-sc-g0xbh4-0 haNAWn prc-Text-Text-0ima0"
                style="outline: none; border-right-width: 1px; border-right-style: solid; border-color: var(--borderColor-default,var(--color-border-default,#30363d)); padding-right: 4px;"
                >Behind</span
            ><span
                class="Box-sc-g0xbh4-0 kJTOpK prc-Text-Text-0ima0"
                style="outline: none; padding-left: 4px;"
                >Ahead</span
            >
            </div>
        </th>
        <th class="TableHeader prc-DataTable-TableHeader-CRPoj" role="columnheader" scope="col">Pull request</th>
        </tr>
    </thead>
    <tbody
        class="TableBody prc-DataTable-TableBody-p56SS"
        role="rowgroup"
        style="outline: none"
    >
        ${rows}
    </tbody>
    </table>
    </div>`;
}

/**
 * Parse repository `owner`, `repo` and `insertionPoint` from current loaded URL
 * @returns {{ owner: string, repo: string, insertionPoint: Element } | null} - Repository info or null if not found
 */
function parseRepoFromUrl(): { owner: string; repo: string; insertionPoint: Element } | null {
  // The insertion point is slightly below the repository's name in a repository's main page
  const insertionPoint: Element | null = document.querySelector('div[class="Layout-main"]');
  if (!insertionPoint) {
    return null;
  }

  const repoInfo: RepositoryInfo | undefined = getRepo();

  // Regex to accept parsing pathnames such as `/owner/repo/tree/feat/user-groups/api`
  // const match = window.location.pathname.match(repoFromUrlRegex);
  // const match = repoFromUrlRegex.exec(window.location.pathname);
  // if (!match) {
  //   return null;
  // }

  if (!repoInfo) {
    console.warn('⚠️ [GitHub Active Branches] Could not detect repository info from URL');
    return null;
  }

  // const [, owner, repo] = match;
  // if (!owner || !repo) {
  //   return null;
  // }
  console.log(`repoInfo: ${repoInfo.owner} - repo: ${repoInfo.name}`);

  // Skip if it's a user/org page or other special pages
  // if (['settings', 'notifications', 'issues', 'pulls'].includes(owner)) {
  //   return null;
  // }

  return { owner: repoInfo.owner, repo: repoInfo.name, insertionPoint };
}

// /**
//  * Make authenticated GitHub API request
//  * @param {string} url - API endpoint URL
//  * @returns {Promise<Object>} - API response data
//  */
// function githubApiRequest(url: string) {
//   return new Promise((resolve, reject) => {
//     const headers: Record<string, string> = {
//       Accept: 'application/vnd.github.v3+json',
//       'User-Agent': 'GitHub-Branches-Userscript',
//     };

//     const GH_TK = configManager.get('GITHUB_TOKEN');

//     if (GH_TK) {
//       headers['Authorization'] = `token ${GH_TK}`;
//     }

//     GM_xmlhttpRequest({
//       method: 'GET',
//       url: url,
//       headers: headers,
//       onload: function (response) {
//         const { status, responseText } = response;
//         if (status === 200) {
//           try {
//             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//             resolve(JSON.parse(responseText!));
//           } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             reject(new Error(`Failed to parse JSON response: ${errorMessage}`));
//           }
//         } else {
//           // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-member-access
//           reject(new Error(`${status} - ${JSON.parse(responseText!).message}`));
//         }
//       },
//       onerror: function () {
//         reject(new Error('Network error'));
//       },
//       ontimeout: function () {
//         reject(new Error('Request timeout'));
//       },
//       timeout: 10000,
//     });
//   });
// }

function teste(my, oi: string): string {
  // const k = `Hello, ${my}!`;
  return my + oi;
}

/**
 * Format date for display (similar to GitHub's relative-time)
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
// function formatDate(dateString: string) {
// : (dateString: string): string
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diffInSeconds: number = Math.floor((+now - +date) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Escape HTML characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Insert the branches table at the top of the repository page
 * @param {string} tableHtml - Complete table HTML
 * @param {Element} insertionPoint - The insertion point
 */
function insertBranchesTable(tableHtml: string, insertionPoint: Element) {
  // Remove existing table if present
  const existingTable = document.getElementById('userscript-branches-table');
  if (existingTable) {
    existingTable.remove();
  }

  insertionPoint.insertAdjacentHTML('afterbegin', tableHtml);
}

/**
 * Fetches and parses GitHub's active branches page, retrieving a direct list of active branches with additional information, such as `authoredDate`.
 * This is the initial information we need.
 * The list is already sorted from most recent to oldest.
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<CachedData>} - Object containing initial branch data and the default branch.
 */
async function getInitialBranchDataFromGitHub(owner: string, repo: string): Promise<CachedData> {
  const cacheKey = `initial-branch-data:${owner}/${repo}`;

  if (cache.has(cacheKey)) {
    const cached: CacheEntry | undefined = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < configManager.get('CACHE_DURATION')) {
      return cached.data;
    }
  }

  const url = `https://github.com/${owner}/${repo}/branches/active`;
  console.log(`🌐 [GitHub Active Branches] Fetching active branches page: ${url}`);

  try {
    const htmlContent: string = await fetchGitHubPage(url);
    const parser = new DOMParser();
    const doc: Document = parser.parseFromString(htmlContent, 'text/html');

    const payloadData: Element | null = doc.querySelector(
      '#repo-content-pjax-container > react-app > script',
    );
    if (!payloadData) {
      throw new Error('Could not find the payload data in the active branches page');
    }
    const jsonString = payloadData.textContent.trim();
    const { payload, appPayload }: GithubActiveBranchesData = JSON.parse(
      jsonString,
    ) as GithubActiveBranchesData;

    let branchesData: BranchesData[] | null = payload?.branches ?? null;
    const defaultBranch: string | null = appPayload?.repo?.defaultBranch ?? null;

    if (branchesData === null || branchesData.length === 0) {
      console.log('📄 [GitHub Active Branches] No active branches found');
      branchesData = null;
      if (defaultBranch === null) {
        return { branchesData, defaultBranch };
      } else {
        const activeBranchesData = { branchesData, defaultBranch };
        cache.set(cacheKey, { data: activeBranchesData, timestamp: Date.now() });
        return activeBranchesData;
      }
    }

    console.log(`✅ [GitHub Active Branches] Extracted active branch:`, branchesData);
    const activeBranchesData = { branchesData, defaultBranch };
    cache.set(cacheKey, { data: activeBranchesData, timestamp: Date.now() });
    return activeBranchesData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Failed to fetch the initial branch data from GitHub's active branches page:",
      error,
    );
    throw new Error(`Could not fetch active branches page: ${errorMessage}`);
  }
}

/**
 * Fetch GitHub page HTML content
 * @param {string} url - GitHub page URL
 * @returns {Promise<string>} - HTML content
 */
function fetchGitHubPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      onload: function (response) {
        if (response.status === 200) {
          if (response.responseText) {
            resolve(response.responseText);
          } else {
            reject(new Error('Empty response from fetchGitHubPage call'));
          }
        } else {
          reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
        }
      },
      onerror: function () {
        reject(new Error('Network error while fetching GitHub page'));
      },
      ontimeout: function () {
        reject(new Error('Timeout while fetching GitHub page'));
      },
      timeout: 15000,
    });
  });
}

/**
 * Get complete active branch data from GitHub.
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<CachedData>} - Object containing full branch data and the default branch.
 */
async function getActiveBranchDataFromGitHub(owner: string, repo: string): Promise<CachedData> {
  const cacheKey = `full-branch-data:${owner}/${repo}`;

  if (cache.has(cacheKey)) {
    const cached: CacheEntry | undefined = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < configManager.get('CACHE_DURATION')) {
      return cached.data;
    }
  }

  try {
    // eslint-disable-next-line prefer-const
    let { branchesData, defaultBranch } = await getInitialBranchDataFromGitHub(owner, repo);

    if (branchesData === null) {
      const activeBranchesData = { branchesData, defaultBranch };
      if (defaultBranch === null) {
        return activeBranchesData;
      } else {
        cache.set(cacheKey, { data: activeBranchesData, timestamp: Date.now() });
        return activeBranchesData;
      }
    }

    // Limit results to `MAX_BRANCHES` configuration option
    branchesData = branchesData.slice(0, configManager.get('MAX_BRANCHES'));

    const moreBranchDataFetch: Response = await fetch(
      `https://github.com/${owner}/${repo}/branches/deferred_metadata?include_authors=true`,
      {
        headers: {
          accept: 'application/json',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'application/json',
          'github-verified-fetch': 'true',
          priority: 'u=1, i',
          'sec-ch-ua': '"Not;A=Brand";v="99", "Brave";v="139", "Chromium";v="139"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'x-requested-with': 'XMLHttpRequest',
        },
        referrer: `https://github.com/${owner}/${repo}/branches/active`,
        body: `{"branches": ${JSON.stringify(branchesData.map((x: BranchesData) => x.name))}}`,
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
      },
    );

    if (!moreBranchDataFetch.ok) {
      throw new Error(
        `Failed to fetch branch deferred metadata: ${moreBranchDataFetch.status} - ${moreBranchDataFetch.statusText}`,
      );
    }

    const moreBranchData = (
      (await moreBranchDataFetch.json()) as GithubActiveBranchesDeferredMetadata
    ).deferredMetadata;

    if (!moreBranchData) {
      throw new Error(`Failed to fetch branch deferred metadata`);
    }

    for (const branchData of branchesData) {
      const moreData = moreBranchData[branchData.name];
      if (moreData) {
        branchData.aheadBehind = moreData.aheadBehind;
        branchData.pullRequest = moreData.pullRequest;
      }
    }

    console.log(
      `🎉 [GitHub Active Branches] Processing complete: ${branchesData.length} active branches processed`,
    );
    const activeBranchesData = { branchesData, defaultBranch };
    cache.set(cacheKey, { data: activeBranchesData, timestamp: Date.now() });
    return activeBranchesData;
  } catch (error) {
    console.error('Failed to fetch the full active branch data from GitHub: ', error);
    throw error;
  }
}

async function loadBranchesTable() {
  console.log(`isRepoTree: ${isRepoTree()}`);
  console.log(`isRepoRoot: ${isRepoRoot()}`);
  console.log(`is404: ${is404()}`);

  if (!isRepoTree() || !isRepoRoot() || is404()) {
    console.log(`FAIL`);
    console.log(`isRepoTree: ${isRepoTree()}`);
    console.log(`isRepoRoot: ${isRepoRoot()}`);
    console.log(`is404: ${is404()}`);
    return;
  }

  const repoInfo = parseRepoFromUrl();
  if (!repoInfo) {
    return;
  }

  const { owner, repo, insertionPoint } = repoInfo;

  try {
    insertBranchesTable(
      `
            <div id="userscript-branches-table" style="margin-top: 24px; padding: 20px; text-align: center; border: 1px solid #d1d9e0; border-radius: 6px;">
                <div>Loading latest ${configManager.get('MAX_BRANCHES')} active branches...</div>
            </div>
        `,
      insertionPoint,
    );

    // Get active branches
    const { branchesData, defaultBranch } = await getActiveBranchDataFromGitHub(owner, repo);
    if (branchesData === null || defaultBranch === null) {
      let branchActivityStatus: string;
      if (defaultBranch === null) {
        branchActivityStatus = 'No branches with activity in the last days';
      } else {
        branchActivityStatus = `Branches with activity in the last days (excluding ${defaultBranch})`;
      }
      insertBranchesTable(
        `
                <div id="userscript-branches-table" style="margin-top: 24px; padding: 20px; text-align: center; border: 1px solid #d1d9e0; border-radius: 6px;">
                    <div>No active branches found</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                        ${branchActivityStatus}
                    </div>
                </div>
            `,
        insertionPoint,
      );
      return;
    }

    // Set temporary cache data
    tempCache.data = { owner, repo, defaultBranch };

    // Create and insert the table
    const tableHtml: string = createActiveBranchesTable(branchesData, defaultBranch, owner, repo);
    insertBranchesTable(tableHtml, insertionPoint);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to load active branches:', error);
    insertBranchesTable(
      `
            <div id="userscript-branches-table" style="margin-top: 24px; padding: 20px; text-align: center; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; color: #856404;">
                <div>Failed to load active branches: ${errorMessage}</div>
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Check console for details</div>
            </div>
        `,
      insertionPoint,
    );
  }
}

function addCustomStyles(): void {
  const INJECT_FLAG = 'ghab-styles-injected';

  if (document.head.dataset[INJECT_FLAG] === 'true') {
    console.log('🎨 [GitHub Active Branches] Custom styles already applied');
    return;
  }

  GM_addStyle(styleSheet);
  document.head.setAttribute('data-ghab-styles-injected', 'true');
  console.log('🎨 [GitHub Active Branches] Custom styles applied');
}

/**
 * Initialize the userscript
 */
function init() {
  // unsafeWindow.GitHubActiveBranchesCache = {
  //     stats: () => cache.getStats(),
  //     cleanup: () => cache.cleanup(),
  //     clear: () => cache.clear(),
  //     maintenance: () => cache.performMaintenance(),
  // };

  // Add `styleSheet` if not already present
  addCustomStyles();
  // Perform cache maintenance on startup
  try {
    cache.performMaintenance();

    // Schedule periodic cleanup every 10 minutes to prevent cache bloat
    setInterval(
      () => {
        cache.cleanup();
      },
      10 * 60 * 1000,
    );
  } catch (error) {
    console.warn('⚠️ [GitHub Active Branches] Cache maintenance failed:', error);
  }

  // GitHub uses the Turbo framework. We can directly hook into Turbo's lifecycle events for much more performant solutions.
  // The turbo:load event is perfect for our use case, as it fires after a new page has been successfully fetched and its content has replaced the old content in the DOM.
  // The event listener's callback (loadBranchesTable) is invoked only when a Turbo-driven navigation occurs. There is no constant monitoring of the DOM.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  document.addEventListener('turbo:load', loadBranchesTable);

  function shortcutHandler(event: KeyboardEvent): void {
    if (event.altKey) {
      if (event.code === 'KeyR') {
        const defaultBranch = getCachedDefaultBranch(location.href);
        if (defaultBranch) {
          console.log(`[GitHub Active Branches] Redirecting to default branch: ${defaultBranch}`);
          // location.href = defaultBranch;
        }
        // const docLocationPathName = document.location.pathname;
        // const groups = docLocationPathName.match(toDefaultBranchRegex)?.groups;
        // if (groups) {
        //   const owner = groups.owner;
        //   const repo = groups.repo;
        //   const middle = groups.middle;
        //   const rest = groups.rest;
        //   const currentBranch = groups.branch;
        //   const repoData = await getRepositoryInfo(owner, repo);
        //   const defaultBranch = repoData.default_branch;
        //   if (repoData.default_branch !== currentBranch) {
        //     if (rest) {
        //       document.location.pathname = docLocationPathName.replace(
        //         toDefaultBranchRegex,
        //         `/$<owner>/$<repo>/$<middle>/${defaultBranch}/$<rest>`,
        //       );
        //     } else {
        //       document.location.pathname = docLocationPathName.replace(
        //         toDefaultBranchRegex,
        //         `/$<owner>/$<repo>/$<middle>/${defaultBranch}`,
        //       );
        //     }
        //   }
        // }
      } else if (event.code === 'KeyE') {
        console.log('[GitHub Active Branches] Cache cleaned');
        cache.cleanup(1);
      }
    }
  }

  // Press `ALT+R` on a URL such as `github.com/{OWNER}/{repo}/blob/{BRANCH}/{FILE}` or `github.com/{OWNER}/{repo}/tree/{BRANCH}`: changes to view it in the default branch
  // Press `ALT+E` to clean the full cache
  document.addEventListener('keydown', shortcutHandler);
}

// Start the userscript
init();
