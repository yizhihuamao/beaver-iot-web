/**
 * 常用工具函数
 *
 * 注意：工具函数必须为纯函数
 */

import axios, { type Canceler } from 'axios';

/**
 * 判断是否为本地 IP 地址
 * @param {String} ip
 * @returns
 */
export const isLocalIP = (ip: string): boolean => {
    // 判断是否为 IPv6 地址
    if (ip.includes(':')) {
        return (
            /^fe80::/.test(ip) ||
            /^::1$/.test(ip) ||
            /^fd[0-9a-f]{2}(:[0-9a-f]{4}){3}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}$/.test(
                ip,
            )
        );
    }

    // 判断是否为 IPv4 地址
    const ipParts = ip.split('.');
    if (ipParts.length !== 4) {
        return false;
    }

    const firstPart = parseInt(ipParts[0]);
    const secondPart = parseInt(ipParts[1]);

    // 判断是否为私有地址
    if (firstPart === 10) {
        return true;
    }
    if (firstPart === 172 && secondPart >= 16 && secondPart <= 31) {
        return true;
    }
    if (firstPart === 192 && ipParts[1] === '168') {
        return true;
    }

    // 判断是否为环回地址
    return ip === '127.0.0.1' || ip === '::1';
};

/**
 * 异步加载 JS 资源文件
 * @param src 资源文件路径
 * @param attrs 自定义 script 属性
 * @param removeOnLoad 加载完成后是否移除脚本标签，默认为 false
 * @returns 返回一个 Promise，resolve 参数为加载完成后的 HTMLScriptElement 元素
 */
export const loadScript = (
    src: string,
    attrs?: Record<string, any>,
    removeOnLoad = false,
): Promise<HTMLScriptElement> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.async = true;
        script.src = src;

        if (attrs) {
            // eslint-disable-next-line
            for (const key in attrs) {
                if (Object.prototype.hasOwnProperty.call(attrs, key)) {
                    script.setAttribute(key, attrs[key]);
                }
            }
        }

        const handleLoad = (): void => {
            cleanup();
            resolve(script);
        };

        const handleError = (event: ErrorEvent): void => {
            cleanup();
            reject(new Error(`Failed to load script: ${src} (${event.message})`));
        };

        const cleanup = (): void => {
            script.removeEventListener('load', handleLoad);
            script.removeEventListener('error', handleError);
            if (removeOnLoad && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);
        document.head.appendChild(script);
    });
};

/**
 * 动态插入 JavaScript 代码到页面中
 * @param code 要插入的 JavaScript 代码
 * @returns 插入的 `<script>` 标签对象
 */
export const loadScriptCode = (code: string): HTMLScriptElement => {
    const script = document.createElement('script');

    script.innerHTML = code;
    document.head.appendChild(script);
    return script;
};

type CSSLoadOptions = {
    /** 元素属性 */
    attrs?: Record<string, any>;
    /** 是否在 head 所有子元素之前插入。默认 `false`，即插入到所有子元素之后 */
    insertBefore?: boolean;
};
/**
 * 异步加载样式表资源文件
 * @param url 资源地址
 * @param options.attrs 自定义 link 属性
 * @param options.insertBefore 是否在 head 所有子元素之前插入。默认 `false`，即插入到所有子元素之后
 * @returns 返回一个 Promise，resolve 参数为加载完成后的 HTMLLinkElement 元素
 */
export const loadStylesheet = (
    url: string,
    options: CSSLoadOptions = {},
): Promise<HTMLLinkElement> => {
    const { attrs, insertBefore } = options;

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;

        if (attrs) {
            // eslint-disable-next-line
            for (const key in attrs) {
                if (Object.prototype.hasOwnProperty.call(attrs, key)) {
                    link.setAttribute(key, attrs[key]);
                }
            }
        }

        const handleLoad = (): void => {
            cleanup();
            resolve(link);
        };

        const handleError = (event: ErrorEvent): void => {
            cleanup();
            reject(new Error(`Failed to load stylesheet: ${url} (${event.message})`));
        };

        const cleanup = (): void => {
            link.removeEventListener('load', handleLoad);
            link.removeEventListener('error', handleError);
        };
        const head = document.head || document.getElementsByTagName('head')[0];

        link.addEventListener('load', handleLoad);
        link.addEventListener('error', handleError);

        if (insertBefore) {
            const { firstChild } = head;
            if (firstChild) {
                head.insertBefore(link, firstChild);
            } else {
                head.appendChild(link);
            }
        } else {
            head.appendChild(link);
        }
    });
};

interface TruncateOptions {
    /** 最大字符数 */
    maxLength: number;
    /** 截断占位符，默认为 '...' */
    ellipsis?: string;
    /** 占位符位置，默认为 'end' */
    ellipsisPosition?: 'start' | 'middle' | 'end';
}
/**
 * 将字符串截断为指定长度，并添加截断占位符
 * @param {String} str 需要截断的字符串
 * @param {Options} options 截断选项
 * @returns {String} 返回截断后的字符串
 */
export const truncate = (str: string, options: TruncateOptions): string => {
    const { maxLength, ellipsis = '...', ellipsisPosition = 'end' } = options;

    if (typeof str !== 'string') {
        throw new TypeError('参数必须是字符串类型');
    }

    // eslint-disable-next-line
    const regExp = /([\u4e00-\u9fa5])|([^\x00-\xff])/g; // 匹配中文和非 ASCII 字符
    let count = 0;
    let truncatedLength = 0;

    for (let i = 0, len = str.length; i < len; i++) {
        if (count >= maxLength) {
            break;
        }
        const char = str[i];
        const isChinese = !!char.match(regExp);
        count += isChinese ? 2 : 1;
        truncatedLength++;

        /**
         * 遍历至最后一个字符，若此时计算字符数小于最大限制字符数，
         * 或者截断长度与字符长度相等，则直接返回原始字符
         */
        if (i === len - 1 && (count <= maxLength || len === truncatedLength)) {
            return str;
        }
    }

    const truncatedStr = str.substring(0, truncatedLength);

    switch (ellipsisPosition) {
        case 'start': {
            return ellipsis + truncatedStr.slice(ellipsis.length);
        }
        case 'middle': {
            // 计算左侧和右侧部分的长度
            const leftHalfMaxLength = Math.floor((maxLength - ellipsis.length) / 2);
            const rightHalfMaxLength = maxLength - ellipsis.length - leftHalfMaxLength;
            // 截取左侧字符
            const leftHalf = truncatedStr.slice(0, leftHalfMaxLength);
            let rightHalf = '';
            let count = 0;

            // 截取右侧字符
            for (let i = str.length - 1; i >= 0; i--) {
                if (count >= rightHalfMaxLength) {
                    break;
                }
                const char = str[i];
                const isChinese = !!char.match(regExp);
                count += isChinese ? 2 : 1;
                rightHalf = `${char}${rightHalf}`;
            }

            // 拼接字符串
            return leftHalf + ellipsis + rightHalf;
        }
        case 'end': {
            return truncatedStr + ellipsis;
        }
        default: {
            throw new Error(`无效的占位符位置 "${ellipsisPosition}"`);
        }
    }
};

/**
 * 版本号比较函数，判断第一个版本号是否大于等于第二个版本号
 * @param {String} version1 第一个版本号（支持 1.1, 1.2.3, v1.2.3 格式）
 * @param {String} version2 第二个版本号（支持 1.1, 1.2.3, v1.2.3 格式）
 */
export const compareVersions = (version1: string, version2: string) => {
    const ver1 = !version1.startsWith('v') ? version1 : version1.substring(1);
    const ver2 = !version2.startsWith('v') ? version2 : version2.substring(1);
    const parts1 = ver1.split('.');
    const parts2 = ver2.split('.');
    const length = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < length; i++) {
        const num1 = parseInt(parts1[i] || '0'); // 转换为整数，默认为 0
        const num2 = parseInt(parts2[i] || '0');

        if (num1 > num2) {
            return true;
        }
        if (num1 === num2) {
            if (i + 1 === length) return true;
            continue;
        }

        return false;
    }

    return false;
};

export interface NameInfo {
    firstName?: string;
    lastName?: string;
}
/**
 * 组合名称
 * @param {NameInfo} nameInfo - 包含firstName和lastName的名称对象
 * @param {boolean} isCN - 是否是国内环境
 * @returns {string} 返回组合后的名称
 */
export const composeName = (nameInfo: NameInfo, isCN = true): string => {
    // 兼容值为null/undefined的情况
    const firstName = nameInfo?.firstName || '';
    const lastName = nameInfo?.lastName || '';

    if (isCN) return lastName + firstName;
    return firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName;
};

/**
 * 基于 a 标签的文件下载
 * @param {string | Blob} assets - 文件地址或者blob数据
 * @param {string} fileName - 文件名
 *
 * @description
 * **优势：** 流式下载，大文件下载时减轻CPU及内存压力
 *
 * **受限条件：**
 * 1. 跨域URL的下载，fileName参数将失效，无法重命名。可改用`xhrDownload`方法进行下载
 * 2. Edge等部分浏览器下载office文件时，会自动打开文件预览。可改用`xhrDownload`方法进行下载
 */
export const linkDownload = (assets: string | Blob, fileName: string) => {
    if (!assets) return;

    const fileUrl = assets instanceof Blob ? window.URL.createObjectURL(assets) : assets;

    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = fileUrl;
    link.download = fileName;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(fileUrl);
    document.body.removeChild(link);
};

interface DownloadOptions {
    /**
     * 文件地址或者blob数据
     */
    assets: string | Blob;
    /**
     * 文件名
     */
    fileName: string;
    /**
     * 下载进度回调
     * @param percent 下载进度百分比
     */
    onProgress?: (percent: number) => void;
}
interface xhrDownloadResponse<T> {
    /**
     * 中断下载
     */
    abort: () => void;
    /**
     * 下载成功回调
     */
    then: Promise<T>['then'];
    /**
     * 下载失败回调
     */
    catch: Promise<T>['catch'];
}
/**
 * 基于HTTP的文件下载
 * @param {DownloadOptions} options - 下载参数
 * @param {string | Blob} options.assets - 文件地址或者blob数据
 * @param {string} options.fileName - 下载文件名
 * @param {Function} [options.onProgress] - 下载进度回调
 * @return {xhrDownloadResponse} 返回PromiseLike，包含下载成功回调`then`、失败回调`catch`和下载中断方法`abort`，支持Promise A+调用
 */
export const xhrDownload = ({
    assets,
    fileName,
    onProgress,
}: DownloadOptions): xhrDownloadResponse<string> => {
    if (!assets) {
        throw new Error('assets is required');
    }

    const isBlob = assets instanceof Blob;
    const fileUrl = isBlob ? window.URL.createObjectURL(assets) : assets;

    const { CancelToken } = axios;
    let cancel: Canceler | null = null;
    const client = new Promise<string>((resolve, reject) => {
        // 利用axios下载文件
        axios
            .request({
                url: fileUrl,
                method: 'GET',
                responseType: 'blob',
                cancelToken: new CancelToken(c => {
                    cancel = c;
                }),
                onDownloadProgress: event => {
                    const percent = (event?.progress || 0) * 100;
                    onProgress?.(percent);
                },
            })
            .then(response => {
                const fileStream = response.data as Blob;
                linkDownload(fileStream, fileName);
                resolve(fileName);
            })
            .catch(error => {
                reject(error);
            })
            .finally(() => {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                isBlob && window.URL.revokeObjectURL(fileUrl);
            });
    });

    return {
        abort: () => cancel?.(),
        then: client.then.bind(client),
        catch: client.catch.bind(client),
    };
};

/**
 * 生成UUID的函数
 * @returns UUID
 */
export const generateUUID = (): string => {
    if (window?.crypto?.randomUUID) return window.crypto.randomUUID();

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        // eslint-disable-next-line no-bitwise
        const random = (Math.random() * 16) | 0;
        // eslint-disable-next-line no-bitwise
        return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
};

interface GenerateStrOPtions {
    /** 是否包含大写字母 */
    upperCase?: boolean;
    /** 是否包含小写字母 */
    lowerCase?: boolean;
    /** 是否包含数字 */
    number?: boolean;
    /** 是否包含符号 */
    symbol?: boolean;
}
/**
 * 生成随机字符串
 * @param {number} length - 字符长度，默认为 `8`
 * @param {Object} [options] - 生成字符串的选项，默认包含**大写字母+数字**
 * @param {boolean} options.number - 是否包含数字，默认为 `true`
 * @param {boolean} options.upperCase - 是否包含大写字母，默认为 `true`
 * @param {boolean} options.lowerCase - 是否包含小写字母，默认为 `false`
 * @param {boolean} options.symbol - 是否包含符号，默认为 `false`
 * @returns 随机字符串
 */
export const genRandomString = (
    length = 8,
    options: GenerateStrOPtions = { upperCase: true, number: true },
): string => {
    const getCharacters = () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        const strategy: Record<keyof GenerateStrOPtions, string> = {
            upperCase: letters.toUpperCase(),
            lowerCase: letters,
            number: numbers,
            symbol: symbols,
        };
        if (options) {
            return Object.keys(options)
                .filter(key => options[key as keyof GenerateStrOPtions])
                .map(key => strategy[key as keyof GenerateStrOPtions])
                .join('');
        }

        return Object.values(strategy).join('');
    };
    const characters = getCharacters();

    return new Array(length)
        .fill(0)
        .map(() => characters[Math.floor(Math.random() * characters.length)])
        .join('');
};

/**
 * 数字千位分隔（默认分隔符为 `,`）
 * @param number 待分隔数字
 * @param separator 分隔符
 */
export const thousandSeparate = (number?: number | string, separator = ',') => {
    if (!number && number !== 0) return '';

    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

/**
 * 获取对象类型
 * @param obj 任意对象
 * @returns
 */
export const getObjectType = (obj: any) => {
    const typeString = Object.prototype.toString.call(obj);
    const matched = typeString.match(/^\[object\s(\w+)\]$/);
    const type = matched && matched[1].toLocaleLowerCase();

    return type;
};