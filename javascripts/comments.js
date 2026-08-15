const SUPABASE_URL = "https://uwzpkmlrmamjotspcodw.supabase.co";
const SUPABASE_KEY = "sb_publishable_1ff6CulmdnW-u5ts1drgVQ_T1Ht-lAj";

const COMMENTS_TABLE = "comments";

let currentComments = [];

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

    path = path.replace(/^\/+|\/+$/g, "");

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
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

function getAvatarUrl(nickname) {
    return `https://api.dicebear.com/10.x/adventurer-neutral/svg?seed=${encodeURIComponent(nickname)}`;
}

function resetReplyState() {
    const replyIdInput = document.querySelector("#comment-reply-id");
    const replyNameInput = document.querySelector("#comment-reply-name");
    const replyPreview = document.querySelector("#comment-reply-preview");
    const cancelButton = document.querySelector("#comment-cancel-reply");

    if (replyIdInput) replyIdInput.value = "";
    if (replyNameInput) replyNameInput.value = "";
    if (replyPreview) {
        replyPreview.textContent = "";
        replyPreview.style.display = "none";
    }
    if (cancelButton) {
        cancelButton.hidden = true;
    }
}

function bindReplyActions() {
    document.querySelectorAll(".comment-reply-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const replyId = button.dataset.id || "";
            const replyName = button.dataset.name || "";
            const replyIdInput = document.querySelector("#comment-reply-id");
            const replyNameInput = document.querySelector("#comment-reply-name");
            const replyPreview = document.querySelector("#comment-reply-preview");
            const cancelButton = document.querySelector("#comment-cancel-reply");

            if (replyIdInput) replyIdInput.value = replyId;
            if (replyNameInput) replyNameInput.value = replyName;
            if (replyPreview) {
                replyPreview.textContent = `回复 @${replyName}`;
                replyPreview.style.display = "block";
            }
            if (cancelButton) cancelButton.hidden = false;

            const contentInput = document.querySelector("#comment-content");
            if (contentInput) {
                contentInput.focus();
            }
        });
    });

    document.querySelectorAll(".comment-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const commentId = String(button.dataset.id);
            const target = findCommentById(currentComments, commentId);

            if (!target) {
                return;
            }

            target.collapsed = !target.collapsed;
            renderComments(currentComments);
        });
    });
}

function findCommentById(nodes, targetId) {
    for (const node of nodes) {
        if (String(node.id) === String(targetId)) {
            return node;
        }

        if (node.children && node.children.length > 0) {
            const child = findCommentById(node.children, targetId);
            if (child) {
                return child;
            }
        }
    }

    return null;
}

function buildCommentTree(comments) {
    const map = new Map();
    const roots = [];

    comments.forEach((comment) => {
        const key = String(comment.id);
        map.set(key, {
            ...comment,
            id: key,
            children: [],
            collapsed: Boolean(comment.collapsed)
        });
    });

    comments.forEach((comment) => {
        const item = map.get(String(comment.id));
        const parentKey = comment.parent_id == null ? null : String(comment.parent_id);

        if (parentKey && map.has(parentKey)) {
            map.get(parentKey).children.push(item);
        } else {
            roots.push(item);
        }
    });

    function sortTree(nodes) {
        nodes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        nodes.forEach((node) => {
            if (node.children.length > 0) {
                sortTree(node.children);
            }
        });
    }

    sortTree(roots);
    return roots;
}

function renderCommentNode(node, depth = 0) {
    const nickname = escapeHtml(node.nickname);
    const content = escapeHtml(node.content);
    const date = new Date(node.created_at).toLocaleString();
    const avatarUrl = getAvatarUrl(node.nickname);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const replyTag = node.parent_nickname
        ? `<div class="comment-reply-tag">回复 @${escapeHtml(node.parent_nickname)}</div>`
        : "";

    const toggleButton = hasChildren
        ? `<button class="comment-toggle" type="button" data-id="${node.id}" aria-expanded="${node.collapsed ? "false" : "true"}">${node.collapsed ? "展开" : "收起"}</button>`
        : "";

    const childrenHtml = hasChildren
        ? `<div class="comment-children ${node.collapsed ? "is-collapsed" : ""}">${node.children.map((child) => renderCommentNode(child, depth + 1)).join("")}</div>`
        : "";

    return `
        <div class="comment-node" style="--depth: ${depth};">
            <article class="comment">

                <img
                    class="comment-avatar"
                    src="${avatarUrl}"
                    alt=""
                    loading="lazy"
                >

                <div class="comment-body">
                    <div class="comment-header">
                        <strong>${nickname}</strong>
                        <time>${escapeHtml(date)}</time>
                    </div>

                    ${replyTag}

                    <div class="comment-content">${content}</div>

                    <div class="comment-actions">
                        <button
                            class="comment-reply-btn"
                            type="button"
                            data-id="${node.id}"
                            data-name="${escapeHtml(node.nickname)}"
                        >
                            回复
                        </button>
                        ${toggleButton}
                    </div>
                </div>
            </article>

            ${childrenHtml}
        </div>
    `;
}

function renderComments(comments) {
    const list = document.querySelector("#comment-list");

    if (!list) {
        return;
    }

    currentComments = comments;

    if (comments.length === 0) {
        list.innerHTML = '<p class="no-comments">暂时还没有评论。</p>';
        return;
    }

    const tree = buildCommentTree(currentComments);
    list.innerHTML = tree.map((node) => renderCommentNode(node)).join("");
    bindReplyActions();
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

            <input id="comment-reply-id" type="hidden" value="">
            <input id="comment-reply-name" type="hidden" value="">

            <div id="comment-reply-preview" class="comment-reply-preview" style="display:none;"></div>

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

            <div class="comment-form-actions">
                <button id="comment-submit" type="submit">发表评论</button>
                <button id="comment-cancel-reply" type="button" class="comment-cancel-reply" hidden>取消回复</button>
            </div>

            <p id="comment-message" class="comment-message"></p>

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
    return document.querySelector(".md-content__inner");
}

/**
 * 加载评论
 */
async function loadComments() {
    const postId = getPostId();
    const list = document.querySelector("#comment-list");

    if (!list) {
        return;
    }

    list.innerHTML = "<p>正在加载评论...</p>";

    try {
        const url =
            `${SUPABASE_URL}/rest/v1/${COMMENTS_TABLE}` +
            `?post_id=eq.${encodeURIComponent(postId)}` +
            `&select=*` +
            `&order=created_at.desc`;

        const response = await fetch(url, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const comments = await response.json();
        currentComments = comments;
        renderComments(comments);

    } catch (error) {
        console.error("加载评论失败:", error);
        list.innerHTML = "<p>评论加载失败，请稍后再试。</p>";
    }
}

/**
 * 提交评论
 */
async function submitComment(event) {
    event.preventDefault();

    const nicknameInput = document.querySelector("#comment-nickname");
    const contentInput = document.querySelector("#comment-content");
    const submitButton = document.querySelector("#comment-submit");
    const message = document.querySelector("#comment-message");
    const replyIdInput = document.querySelector("#comment-reply-id");
    const replyNameInput = document.querySelector("#comment-reply-name");

    const nickname = nicknameInput.value.trim();
    const content = contentInput.value.trim();
    const replyId = replyIdInput.value.trim() || null;
    const replyName = replyNameInput.value.trim() || null;

    if (!nickname || !content) {
        return;
    }

    if (nickname.length > 30) {
        message.textContent = "昵称不能超过 30 个字符。";
        return;
    }

    if (content.length > 1000) {
        message.textContent = "评论不能超过 1000 个字符。";
        return;
    }

    submitButton.disabled = true;
    message.textContent = "正在提交...";

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${COMMENTS_TABLE}`,
            {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    post_id: getPostId(),
                    nickname: nickname,
                    content: content,
                    parent_id: replyId,
                    parent_nickname: replyName
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error(error);
            throw new Error(`HTTP ${response.status}`);
        }

        contentInput.value = "";
        resetReplyState();
        message.textContent = "评论发表成功！";
        await loadComments();

    } catch (error) {
        console.error("发表评论失败:", error);
        message.textContent = "发表评论失败，请稍后再试。";
    } finally {
        submitButton.disabled = false;
    }
}

/**
 * 初始化评论系统
 */
function initComments() {
    if (document.querySelector("#comments")) {
        return;
    }

    const article = getArticleElement();
    if (!article) {
        return;
    }

    const commentsUI = createCommentsUI();
    article.appendChild(commentsUI);

    const form = document.querySelector("#comment-form");
    const cancelReplyButton = document.querySelector("#comment-cancel-reply");

    form.addEventListener("submit", submitComment);

    if (cancelReplyButton) {
        cancelReplyButton.addEventListener("click", resetReplyState);
    }

    loadComments();
}

/**
 * 普通页面加载
 */
document.addEventListener("DOMContentLoaded", initComments);

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
