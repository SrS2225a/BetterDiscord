/**
 * @name UserTags
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Allows you to add custom tags to users and search byt them.
 * @website https://fenriris.net
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js
 */

const config = {
    info: {
        name: "UserTags",
        authors: [
            {
                name: "Nyx",
                discord_id: "27048136006729728",
            }
        ],
        version: "1.3.1",
        description: "Allows you to add custom tags to users. You can use these tags to filter users by their tags."
    },
    github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/UserTags/UserTags.plugin.js",
    github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js",
    changelog: [
        {
            title: "Fixes",
            items: ["Tags no longer shift the context menu when they get too long."]
        }
    ],
    main: "index.js",
};

const { Data, UI, Webpack, React, DOM, } = BdApi;
const StoreModules = {
    UserStore: Webpack.getStore("UserStore"),
    RelationshipStore: Webpack.getStore("RelationshipStore"),
    ChannelStore: Webpack.getStore("ChannelStore"),
}

class UserTags {
    constructor() {
        this._config = config;
        this.settings = Data.load(this._config.info.name, "settings");

        this.userPopoutPatched = false
    }

    start() {
        BdApi.injectCSS(config.info.name, `
            .user-tag-container {
                display: flex;
                border: 1px solid var(--user-profile-border);
                border-radius: var(--radius-sm);
                border-radius: 5px;
                padding: 4px 6px;
                margin: 0 4px 4px 0;
                align-items: center;
            }   
            .user-tag-input {
                background-color: transparent;
                border: none;
                color: var(--interactive-active);
                font-size: 12px;
                font-weight: 500;
                font-family: var(--font-primary);
                flex: 1;
                white-space: nowrap;
                padding: 0;
                margin: 0;
                width: 10px;
                max-width: 250px;
            }
            .user-tag-cancel-button {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 12px;
                height: 12px;
                margin-right: 4px;
                border-radius: 50%;
                padding: 0;
                flex-shrink: 0;
                background-color: rgb(185, 187, 190);Modules
                cursor: pointer;
            }
            .btn-add-tag {
                border: 1px solid var(--user-profile-border);
                border-radius: var(--radius-sm);
                color: var(--interactive-normal);
                height: 24px;
                padding: 4px;
                width: fit-content;
                align-items: center;
                background: none;
                box-sizing: border-box;
                display: flex;
                font-size: 14px;
                font-weight: 500;
                justify-content: center;
                line-height: 16px;
                position: relative;
                user-select: none;
                
            }
            .btn-add-tag:hover {
                background-color: var(--user-profile-background-hover);
            }

            .user-tag-cancel-button-icon {
                width: 10px;
                top: 50%;
                left: 50%;
                fill: var(--interactive-normal);
            }
            
            .user-tag-body {
                display: flex;
                flex-wrap: wrap;
            }
            .user-tag-main {
                display: block;
            }
            .user-tag-title {
                font-size: 12px;
                font-weight: 700;
                font-family: var(--font-display);
                color: var(--header-secondary);
                margin-bottom: 8px;
                width: 100%;
            }

            .user-tag-add-button-icon {
                width: 16px;
                height: 16px;
                fill: var(--background-primary);
                cursor: pointer;
            }
        `);

        const UserProfileModuleSmall = BdApi.Webpack.getByStrings(".pronouns", "UserProfilePopoutBody", "relationshipType", { defaultExport: false });
        BdApi.Patcher.after("userProfileSmall", UserProfileModuleSmall, "Z", (_, [props], res) => {
            const tagSection = React.createElement("div", {
                className: "user-tag-main",

                },
                React.createElement("h3", {
                    className: "user-tag-title",
                }, "Tags"),
             this.runTags(props, res)
        );
            // add new array element to the children array
            res.props.children.push(tagSection);
        })

        const UserProfileModuleFull = BdApi.Webpack.getByStrings("trackUserProfileAction", "displayProfile", ".hidePersonalInformation", { defaultExport: false });
        BdApi.Patcher.after("userProfileFull", UserProfileModuleFull, "Z", (_, [props], res) => {
            res.props.children[4].props.heading = "Tags";
            res.props.children[4].props.children = this.runTags(props, res);
        });

        //             console.warn(StoreModules.UserStore.getUser(props.user.id));
        BdApi.Patcher.after("QuickSwitcher", BdApi.Webpack.getByStrings("QuickSwitcher", ".searchableTitles", { defaultExport: false }), "Z", (that, args, res) => {
            console.warn(res);
            let query = res.props.query;
            if (query?.startsWith("&")) {
                let users = res.props.results = [];
                query = query.substring(1);
                const keywords = query.split(" ");
                let data = Data.load(this._config.info.name, "UserData") || [];
                let userIds = [];

                // find all the users that match the tags
                function findUsers(keywords, data) {
                    if (keywords.length === 0) return;
                    let userIds = [];
                    for (let userId in data) {
                        let userTags = data[userId];
                        for (let i = 0; i < keywords.length; i++) {
                            // use not operator to find users that don't have the tag
                            if (keywords[i].startsWith("!")) {
                                if (!userTags.some(tag => tag.toLowerCase().includes(keywords[i].substring(1).toLowerCase()))) {
                                    userIds.push(userId);
                                }
                            } else {
                                if (userTags.some(tag => tag.toLowerCase().includes(keywords[i].toLowerCase()))) {
                                    userIds.push(userId);
                                }
                            }
                        }
                    }
                    return userIds;
                }
                userIds = findUsers(keywords, data);

                // add the users to the results
                for (let i = 0; i < userIds.length; i++) {
                    // do not add the user to the list if they are already in the list
                    if (users.some(user => user.record.id === userIds[i])) continue;
                    let user = StoreModules.UserStore.getUser(userIds[i]);
                    if (user) {
                        users.push({
                            comparator: user.username,
                            record: user,
                            type: "USER"
                        })
                    }
                }
            } else {
                return res;
            }
        });
        
    }

    stop() {
        BdApi.Patcher.unpatchAll("userProfileSmall");
        BdApi.Patcher.unpatchAll("userProfileFull");
        BdApi.Patcher.unpatchAll("QuickSwitcher");
        BdApi.clearCSS(this._config.info.name);
    }

    runTags(props, ret) {
        if (!document.querySelector(".user-tag-container")?.children) this.userPopoutPatched = false;

        // check if the html code was already added using DOMTools
        const addIcon = React.createElement("svg", {
            viewBox: "0 0 24 24",
            height: "32",
            width: "32",
            className: "user-tag-add-button-icon",
        }, React.createElement("path", {
            fill: "currentColor",
            d: "M13 6a1 1 0 1 0-2 0v5H6a1 1 0 1 0 0 2h5v5a1 1 0 1 0 2 0v-5h5a1 1 0 1 0 0-2h-5V6Z"
        }));
        const tagsHeading = React.createElement("h3", {
            className: "user-tag-title"
        }, "TAGS");
        let setupUSerTags = React.createElement(React.Fragment, {
                key: "userTags"
            },
            React.createElement("div", {
                className: "user-tag-body flex-3BkGQD wrap-7NZuTn",
            }, React.createElement("button", {
                className: "btn-add-tag",
                onClick: () => {
                    this.createTagPending(props.user.id)
                }
            },
            
           addIcon))
        )


        if (!this.userPopoutPatched) {
            // loop through tags and add them to the user profile
            const data = Data.load(this._config.info.name, "UserData") || [];
            const userTags = data[props.user.id] || [];
            if (userTags.length > 0) {
                for (let i = 0; i < Object.values(userTags).length; i++) {
                    if (userTags[i]) {
                        this.createTagPending(props.user.id, userTags[i])
                    }
                }
            }
            this.userPopoutPatched = true;
        }
        return setupUSerTags
    }

    createTagPending(userId, tag = null) {
        const div = DOM.createElement("div", {
            className: "user-tag-container",
            draggable: true,
            id: crypto.randomUUID()
        });

        const cancelButtonIcon = DOM.createElement("span", {
            className: "user-tag-cancel-button-icon"
        });

        const cancelButton = DOM.createElement("div", {
            className: "user-tag-cancel-button"
        }, cancelButtonIcon);

        const input = DOM.createElement("input", {
            className: "user-tag-input",
            type: "text",
            maxLength: 60,
            placeholder: "Tag"
        });

        div.append(cancelButton, input);

        // Insert into DOM before the Add button
        const insertTarget = document.querySelector(".btn-add-tag");
        if (insertTarget) {
            insertTarget.parentElement.insertBefore(div, insertTarget);
            this.userPopoutPatched = true;
        }

        if (tag) {
            input.value = tag;
            input.style.width = "0";
            input.style.width = `${input.scrollWidth}px`;
        } else {
            input.focus();
            input.select();
        }

        // Hover effect on cancel button
        div.addEventListener("mouseenter", () => {
            if (!cancelButtonIcon.querySelector("svg")) {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", "26");
                svg.setAttribute("height", "26");
                svg.setAttribute("viewBox", "0 0 60 20");
                svg.setAttribute("aria-hidden", "true");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("fill", "#2f3136");
                path.setAttribute("d", "M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z");

                svg.appendChild(path);
                cancelButtonIcon.appendChild(svg);
            }
        });

        div.addEventListener("mouseleave", () => {
            const svg = cancelButtonIcon.querySelector("svg");
            if (svg) svg.remove();
        });

        // Drag and drop support
        div.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", div.id);
        });

        div.addEventListener("dragover", (e) => e.preventDefault());

        div.addEventListener("drop", (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            const parent = e.currentTarget.parentElement;
            const tags = Array.from(parent.children);

            const elementToMove = tags.find(tag => tag.id === draggedId);
            if (!elementToMove || elementToMove === e.currentTarget) return;

            const currentIndex = tags.indexOf(e.currentTarget);
            const draggedIndex = tags.indexOf(elementToMove);

            const insertIndex = currentIndex > draggedIndex ? currentIndex + 1 : currentIndex;
            const referenceElement = parent.children[insertIndex];
            parent.insertBefore(elementToMove, referenceElement);

            const data = Data.load(config.info.name, "UserData");
            const tag = data[userId].find((tag) => tag === elementToMove.querySelector(".user-tag-input").value);

            data[userId].splice(data[userId].indexOf(tag), 1);
            data[userId].splice(insertIndex, 0, tag);

            Data.save(this._config.info.name, "UserData", data);
        });

        // Input event logic
        input.addEventListener("input", (e) => {
            const data = Data.load(this._config.info.name, "UserData") || {};
            if (!data[userId]) data[userId] = [];

            const parent = e.target.parentElement?.parentElement;
            if (!parent) return;

            const inputs = Array.from(parent.querySelectorAll(".user-tag-input"));
            const index = inputs.indexOf(e.target);

            e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
            e.target.style.width = "0";
            e.target.style.width = e.target.scrollWidth + "px";

            data[userId][index] = e.target.value;

            Data.save(this._config.info.name, "UserData", data);
        });

        cancelButton.addEventListener("click", (e) => {
            const tagDiv = e.target.closest(".user-tag-container");
            const parent = tagDiv?.parentElement;
            if (!tagDiv || !parent) return;

            const input = tagDiv.querySelector(".user-tag-input");
            const inputs = Array.from(parent.querySelectorAll(".user-tag-input"));
            const index = inputs.indexOf(input);

            const data = Data.load(this._config.info.name, "UserData") || {};

            // Only update saved data if it exists for this user
            if (data[userId] && index !== -1) {
                data[userId].splice(index, 1);
                if (data[userId].length === 0) {
                    delete data[userId];
                }
                Data.save(this._config.info.name, "UserData", data);
            }

            // Always remove the tag from the DOM
            tagDiv.remove();
        })
    }

    checkForChangelog() {
        try {
            let currentVersionInfo = {};
            try {
                currentVersionInfo = Object.assign({}, { version: this._config.info.version, hasShownChangelog: false }, Data.load(this._config.info.name, "currentVersionInfo"));
            } catch (err) {
                currentVersionInfo = { version: this._config.info.version, hasShownChangelog: false };
            }
            if (this._config.info.version != currentVersionInfo.version) currentVersionInfo.hasShownChangelog = false;
            currentVersionInfo.version = this._config.info.version;
            Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);

            if (!currentVersionInfo.hasShownChangelog) {
                UI.showChangelogModal({
                    title: "UserTags Changelog",
                    subtitle: this._config.info.version,
                    changes: this._config.changelog
                });
                currentVersionInfo.hasShownChangelog = true;
                Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);
            }
        }
        catch (err) {
            Logger.error(this._config.info.name, err);
        }
    }
}

module.export = UserTags;
