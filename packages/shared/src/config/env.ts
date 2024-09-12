// import { isLocalIP } from '../utils/tools';

// const { protocol, origin, hostname } = window.location;
const metaEnv = import.meta.env;

// 全局暴露构建时间、构建 Hash 信息，以便快速排查问题
window.$metaEnv = {
    buildTime: metaEnv.BUILD_TIMESTAMP ? new Date(metaEnv.BUILD_TIMESTAMP) : '',
    latestGitHash: metaEnv.LATEST_COMMIT_HASH,
};

/** 应用运行的模式 */
export const mode = metaEnv.MODE;

/**
 * 应用版本号
 */
export const appVersion = metaEnv.APP_VERSION || '';