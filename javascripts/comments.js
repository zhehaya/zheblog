const SUPABASE_URL = "https://uwzpkmlrmamjotspcodw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1ff6CulmdnW-u5ts1drgVQ_T1Ht-lAj";

const COMMENTS_TABLE = "comments";

let commentsContainer = null;


/**
 * 获取当前文章 ID
 *
 * 例如：
 * /python/decorator/
 *
 * 会转换成：
 *
 * python/decorator
 */
function getPostId() {
    const url = new URL(window.location.href);

    let path = url.pathname;

    // 去掉开头和结尾的 /
    path = path.replace(/^\/+|\/+$/g, "");

    // 首页使用 index
    if (!path) {
        return "index";
    }

    return path;
}


/**
 * HTML 转义
 *
 * 防止用户输入 HTML / JavaScript
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
function getAvatarUrl(nickname) {
    return `https://api.dicebear.com/10.x/adventurer-neutral/svg?seed=${encodeURIComponent(nickname)}`;
}

/**
 * 创建评论区域
 */
function createCommentsUI() {
    const wrapper = document.createElement("section");

    wrapper.id = "comments";

    wrapper.innerHTML = `
        <h2>评论</h2>

        <form id="comment-form">

            <div class="comment-field">
                <label for="comment-nickname">
                    昵称
                </label>

                <input
                    id="comment-nickname"
                    type="text"
                    maxlength="30"
                    required
                    placeholder="请输入昵称"
                >
            </div>

            <div class="comment-field">
                <label for="comment-content">
                    评论
                </label>

                <textarea
                    id="comment-content"
                    maxlength="1000"
                    rows="5"
                    required
                    placeholder="写下你的评论..."
                ></textarea>
            </div>

            <button
                id="comment-submit"
                type="submit"
            >
                发表评论
            </button>

            <p
                id="comment-message"
                class="comment-message"
            ></p>

        </form>

        <div id="comment-list">
            <p>正在加载评论...</p>
        </div>
    `;

    return wrapper;
}


/**
 * 找到 MkDocs 文章正文
 */
function getArticleElement() {
    return document.querySelector(
        ".md-content__inner"
    );
}


/**
 * 加载评论
 */
async function loadComments() {

    const postId = getPostId();

    const list = document.querySelector(
        "#comment-list"
    );

    if (!list) {
        return;
    }

    list.innerHTML = "<p>正在加载评论...</p>";

    try {

        const url =
            `${SUPABASE_URL}/rest/v1/${COMMENTS_TABLE}` +
            `?post_id=eq.${encodeURIComponent(postId)}` +
            `&select=*` +
            `&order=created_at.asc`;

        const response = await fetch(url, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization":
                    `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const comments = await response.json();

        renderComments(comments);

    } catch (error) {

        console.error(
            "加载评论失败:",
            error
        );

        list.innerHTML =
            "<p>评论加载失败，请稍后再试。</p>";
    }
}


/**
 * 显示评论
 */
function renderComments(comments) {

    const list = document.querySelector(
        "#comment-list"
    );

    if (!list) {
        return;
    }

    if (comments.length === 0) {

        list.innerHTML =
            '<p class="no-comments">暂时还没有评论。</p>';

        return;
    }

    list.innerHTML = comments
        .map(comment => {

            const nickname =
                escapeHtml(comment.nickname);

            const content =
                escapeHtml(comment.content);

            const date =
                new Date(
                    comment.created_at
                ).toLocaleString();

            const avatarUrl = getAvatarUrl(comment.nickname);

            return `
                <article class="comment">

                    <img
                        class="comment-avatar"
                        src="${avatarUrl}"
                        alt=""
                        loading="lazy"
                    >

                    <div class="comment-body">

                        <div class="comment-header">

                            <strong>
                                ${nickname}
                            </strong>

                            <time>
                                ${escapeHtml(date)}
                            </time>

                        </div>

                        <div class="comment-content">${content}
                        </div>

                    </div>

                </article>
            `;

        })
        .join("");
}


/**
 * 提交评论
 */
async function submitComment(event) {

    event.preventDefault();

    const form = event.target;

    const nicknameInput =
        document.querySelector(
            "#comment-nickname"
        );

    const contentInput =
        document.querySelector(
            "#comment-content"
        );

    const submitButton =
        document.querySelector(
            "#comment-submit"
        );

    const message =
        document.querySelector(
            "#comment-message"
        );

    const nickname =
        nicknameInput.value.trim();

    const content =
        contentInput.value.trim();

    if (!nickname || !content) {
        return;
    }

    if (nickname.length > 30) {

        message.textContent =
            "昵称不能超过 30 个字符。";

        return;
    }

    if (content.length > 1000) {

        message.textContent =
            "评论不能超过 1000 个字符。";

        return;
    }

    submitButton.disabled = true;

    message.textContent =
        "正在提交...";

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${COMMENTS_TABLE}`,
            {
                method: "POST",

                headers: {
                    "apikey": SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=minimal"
                },

                body: JSON.stringify({
                    post_id: getPostId(),
                    nickname: nickname,
                    content: content
                })
            }
        );

        if (!response.ok) {

            const error =
                await response.text();

            console.error(error);

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        contentInput.value = "";

        message.textContent =
            "评论发表成功！";

        await loadComments();

    } catch (error) {

        console.error(
            "发表评论失败:",
            error
        );

        message.textContent =
            "发表评论失败，请稍后再试。";

    } finally {

        submitButton.disabled = false;
    }
}


/**
 * 初始化评论系统
 */
function initComments() {

    // 防止重复创建
    if (document.querySelector("#comments")) {
        return;
    }

    const article =
        getArticleElement();

    if (!article) {
        return;
    }

    const commentsUI =
        createCommentsUI();

    article.appendChild(commentsUI);

    const form =
        document.querySelector(
            "#comment-form"
        );

    form.addEventListener(
        "submit",
        submitComment
    );

    loadComments();
}


/**
 * 普通页面加载
 */
document.addEventListener(
    "DOMContentLoaded",
    initComments
);


/**
 * Material for MkDocs
 *
 * navigation.instant 页面切换
 */
if (typeof document$ !== "undefined") {

    document$.subscribe(() => {

        initComments();

    });

}