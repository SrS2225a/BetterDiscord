/**
 * @name UserTags
 * @author Nyx
 * @authorId 270848136006729728
 * @version 2.0.0
 * @license MIT
 * @description Allows you to add custom tags to users and search byt them.
 * @website https://nyxgoddess.org/
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js
 */


const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "UserTags",
            authors: [
                {
                    name: "Nyx",
                    discord_id: "27048136006729728",
                }
            ],
            version: "2.0.0",
            description: "Allows you to add custom tags to users. You can use these tags to filter users by their tags."
        },
        github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/UserTags/UserTags.plugin.js",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js",
        changelog: [
            {
                title: "Fixes",
                items: ["Includes fixes for discord modules changes"]
            }
        ],
        main: "index.js",
    };

    return !global.ZeresPluginLibrary ? class {
            constructor() {
                this._config = config;
            }
            getName() {
                return config.info.name;
            }
            getAuthor() {
                return config.info.authors.map((a) => a.name).join(", ");
            }
            getDescription() {
                return config.info.description;
            }
            getVersion() {
                return config.info.version;
            }
            load() {
                BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                            if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                            await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                        });
                    }
                });
            }
            start() {}
            stop() {}
        }
        : (([Plugin, Library]) => {
            const plugin = (Plugin, Library) => {

                const { Patcher, WebpackModules, DiscordModules, DOMTools, PluginUtilities, Structs, Utilities, ReactTools } = Library;
                const {React} = DiscordModules;
                const UserPopoutClasses = Object.assign({}, WebpackModules.getByProps("userPopout"), WebpackModules.getByProps("rolesList"), WebpackModules.getByProps("eyebrow"));
                    const UserPopoutSelectors = {};
                    for (const key in UserPopoutClasses) UserPopoutSelectors[key] = new Structs.Selector(UserPopoutClasses[key]);
                let userPopoutPatched = false

                function createTagPending(userId, tag = null) {
                    const div = DOMTools.createElement("<div class='user-tag-container flex-3BkGQD alignCenter-14kD11' draggable='true'></div>");
                    const cancelButton = DOMTools.createElement("<div class='user-tag-cancel-button roleRemoveButton-17oXnT'></div>");
                    const cancelButtonIcon = DOMTools.createElement("<span class='user-tag-cancel-button-icon roleCircle-3K9O3d flex-3BkGQD alignCenter-14kD11 justifyCenter-rrurWZ desaturateUserColors-1O-G89'></span>");
                    const input = DOMTools.createElement("<input class='user-tag-input' type='text' maxlength='60' placeholder='Tag' />");

                    // adds the correct elements each other
                    cancelButton.appendChild(cancelButtonIcon);
                    div.appendChild(cancelButton);
                    div.appendChild(input);

                    // adds the tag to the user's tag list
                    const element = document.querySelector(".btn-add-tag");
                    if (element) {
                        element.parentElement.insertBefore(div, element);
                        userPopoutPatched = true;
                    }

                    if (tag) {
                        // sets the input value to the tag
                        input.value = tag;
                        input.style.width = '0';
                        input.style.width = input.scrollWidth + "px";
                    } else {
                        // focuses the input if the add button was clicked
                        input.focus();
                        input.select();
                    }

                    div.addEventListener("mouseover", () => {
                        // add path element to cancelButtonIcon
                        const path = DOMTools.createElement("<svg aria-hidden=\"true\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"#2f3136\" d=\"M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z\"></path></svg>");
                        cancelButtonIcon.appendChild(path);
                    })
                    div.addEventListener("mouseout", () => {
                        // remove path element from cancelButtonIcon
                        cancelButtonIcon.removeChild(cancelButtonIcon.lastChild);
                    })

                    // make the tag able to be moved around to change the order
                    div.addEventListener("dragstart", (e) => {
                        e.dataTransfer.setData("text/html", e.target.outerHTML);
                    })
                    div.addEventListener("dragover", (e) => {
                        e.preventDefault();
                    })
                    div.addEventListener("drop", (e) => {
                        const element = e.dataTransfer.getData("text/html");
                        const tags = Array.prototype.slice.call(e.currentTarget.parentElement.children);

                        // gets the element to move to
                        const elementToMove = tags.find((tag) => tag.outerHTML === element);
                        const elementToMoveIndex = Array.prototype.indexOf.call(e.currentTarget.parentElement.children, e.currentTarget) > tags.indexOf(elementToMove)
                            ? Array.prototype.indexOf.call(e.currentTarget.parentElement.children, e.currentTarget) + 1 : Array.prototype.indexOf.call(e.currentTarget.parentElement.children, e.currentTarget); // hacky fix for the index being off by one if the element is moved right
                        // get the element that was dropped on
                        const referenceElement = e.currentTarget.parentElement.children[elementToMoveIndex];
                        // move the element to the new position
                        e.currentTarget.parentElement.insertBefore(elementToMove, referenceElement)

                        // save the new order
                        const data = PluginUtilities.loadData(config.info.name, "UserData");
                        const tag = data[userId].find((tag) => tag === elementToMove.children[1].value);
                        data[userId].splice(data[userId].indexOf(tag), 1);
                        data[userId].splice(elementToMoveIndex, 0, tag);
                        PluginUtilities.saveData(config.info.name, "UserData", data);
                    })

                    const tagContainer = document.querySelector(".scroller-1jBQYo") || document.querySelector(".infoScroller-3MqKC5");
                    input.addEventListener("input", (e) => {
                        const data = PluginUtilities.loadData(config.info.name, "UserData");
                        const indexOf = Object.values(tagContainer.querySelectorAll(".user-tag-input")).indexOf(e.target);
                        // if user is not in data yet, add them
                        if (!data[userId]) data[userId] = [];

                        input.style.width = '0';
                        e.target.style.width = e.target.scrollWidth + "px";
                        input.value = input.value.replace(/[^a-zA-Z0-9_]/g, "");
                        data[userId][indexOf] = input.value;
                        PluginUtilities.saveData(config.info.name, "UserData", data);
                    });

                    cancelButton.addEventListener("click", (e) => {
                        const data = PluginUtilities.loadData(config.info.name, "UserData");
                        const indexOf = Object.values(tagContainer.querySelectorAll(".user-tag-cancel-button-icon")).indexOf(e.target);
                        data[userId].splice(indexOf, 1);
                        // if all tags are removed, remove user from data
                        if (data[userId].length === 0) {
                            delete data[userId];
                        }
                        PluginUtilities.saveData(config.info.name, "UserData", data);
                        // remove the div
                        div.remove();
                    })
                }

                let lastQuery = null;
                var timer;
                return class UserTags extends Plugin {
                    timer;
                    runTags(e) {
                        const popoutMount = (props) => {
                            const popout = document.querySelector(`[class*="userProfileModalInner-"], [class*="userPopoutOuter-"]`);
                            // check if the html code was already added using DOMTools
                            if (!document.querySelector(".user-tag-main")?.children) userPopoutPatched = false;
                            // // use DOMTools to add the html code
                            const addIcon = DOMTools.createElement(`<svg viewBox="2 0 20 20" height="24" width="24" class="user-tag-add-button-icon"><path fill="currentColor" d="M20 11.1111H12.8889V4H11.1111V11.1111H4V12.8889H11.1111V20H12.8889V12.8889H20V11.1111Z"></path></svg>`);
                            const tagsHeading = DOMTools.createElement(`<h3 class="user-tag-title">TAGS</h3>`);
                            const setupUSerTags = DOMTools.createElement(`<div class="user-tag-main"></div>`);
                            const setupUSerTagsBody = DOMTools.createElement(`<div class="user-tag-body flex-3BkGQD wrap-7NZuTn"></div>`);
                            const addTagButton = DOMTools.createElement(`<button class="btn-add-tag"></button>`);
                            addTagButton.addEventListener("click", () => {
                                createTagPending(props.user.id)
                            })
                            addTagButton.appendChild(addIcon);
                            setupUSerTagsBody.appendChild(addTagButton);
                            setupUSerTags.appendChild(tagsHeading);
                            setupUSerTags.appendChild(setupUSerTagsBody);

                            let roleList = popout.querySelector(".scroller-1jBQYo")  || popout.querySelector(".userInfoSection-1gptv0");
                            const section = roleList.getElementsByClassName("section-3FmfOT");

                            if (section.length !== 0) {
                                roleList.insertBefore(setupUSerTags, section[section.length - 2]);
                            } else {
                                const section = roleList.getElementsByClassName('eyebrow-Ejf06y');
                                roleList.insertBefore(setupUSerTags, section[section.length -1]);
                                // add margin-bottom to user-tag-main to make it look better
                                setupUSerTags.style.marginBottom = "16px";
                                setupUSerTags.style.paddingTop = '0';
                            }

                            if (!userPopoutPatched) {
                                // loop through tags and add them to the user profile
                                const data = PluginUtilities.loadData(config.info.name, "UserData");
                                const userTags = data[props.user.id] || [];
                                if (userTags.length > 0) {
                                    for (let i = 0; i < Object.values(userTags).length; i++) {
                                        if (userTags[i]) {
                                            createTagPending(props.user.id, userTags[i])
                                        }
                                    }
                                }
                            }

                            const popoutInstance = ReactTools.getOwnerInstance(popout, {include: ["Popout"]});
                            if (!popoutInstance || !popoutInstance.updateOffsets) return;
                            popoutInstance.updateOffsets();
                        }

                        // wrap in function to prevent errors
                        function tags() {
                            if (!e.addedNodes.length || !(e.addedNodes[0] instanceof Element)) return;
                            const element = e.addedNodes[0];
                            const popout = element.querySelector(`[class*="userProfileModalInner-"], [class*="userPopoutOuter-"]`) ?? element;
                            if (!popout || !popout.matches(`[class*="userProfileModalInner-"], [class*="userPopoutOuter-"], [class*="infoScroller-"]`)) return;
                            const props = Utilities.findInTree(ReactTools.getReactInstance(popout), m => m && m.user, {walkable: ["return", "memoizedProps"]});
                            popoutMount(props);
                        }

                        function searchState () {
                            const getInstance = function (element, filter = () => true) {
                                let fiber = BdApi.getInternalInstance(element);

                                while (fiber && (!(fiber.stateNode instanceof BdApi.React.Component) || !filter(fiber.stateNode))) {
                                    fiber = fiber.return;
                                }

                                return fiber?.stateNode;
                            };


                            if (!e.addedNodes.length || !(e.addedNodes[0] instanceof Element)) return;
                            const element = e.addedNodes[0];
                            const quickSwitcher = document.querySelector(".focusLock-2tveLW") ?? element;
                            if (!element.querySelector(`.quickswitcher-pKcM9U`) || !element.querySelector(`[class*="quickswitcher-"]`).matches(`.quickswitcher-pKcM9U`)) return;
                            const quickSwitcherInstance = ReactTools.getOwnerInstance(quickSwitcher)

                            // important!: we force update the quickswitcher like this in a timer and event listener because the quickswitcher is not an exposed discord internal, so we can't use the discord internal functions to update it
                            // this timer is used because the quickswitcher send its results seemingly at random
                            quickSwitcher?.addEventListener("mousemove", () => {
                                const nodes = Array.from(document.getElementsByClassName("quickswitcher-pKcM9U"));
                                for (const node of nodes) getInstance(node)?.forceUpdate();
                            });
                            if (quickSwitcher) {
                                const input = document.querySelector(".input-3r5zZY")
                                if (input) {
                                    input.addEventListener("input", (e) => {
                                        const query = e.target.value;
                                        if (lastQuery === query) return;
                                        lastQuery = query;
                                        if (query.startsWith("&")) {
                                            if(!timer) {
                                                timer = setInterval(() => {
                                                    const nodes = Array.from(document.getElementsByClassName("quickswitcher-pKcM9U"));
                                                    for (const node of nodes) getInstance(node)?.forceUpdate();
                                                }, 500)
                                            }
                                        } else {
                                            // remove the event listener
                                            clearInterval(timer)
                                            timer = null;
                                        }
                                    })
                                }
                            } else {
                                clearInterval(timer)
                                timer = null;
                            }

                            Patcher.after(quickSwitcherInstance.constructor.prototype, "render", (object, props, ret) => {
                                const property = ret._owner.memoizedProps;
                                let query = property?.query || "";

                                if (query?.startsWith("&")) {
                                    property.results = [];
                                    let users = property.results = [];
                                    query = query.substring(1);
                                    const keywords = query.split(" ");
                                    let data = PluginUtilities.loadData(config.info.name, "UserData");
                                    let userIds = [];

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
                                        let user = DiscordModules.UserStore.getUser(userIds[i]);
                                        if (user) {
                                            users.push({
                                                comparator: user.username,
                                                record: user,
                                                score: 0,
                                                type: "USER"
                                            })
                                        }
                                    }
                                    // update the results
                                    property.results = users;
                                }
                            });

                        }

                        tags()
                        searchState()
                    }

                    bindPopouts() {
                        this.observer = this.runTags.bind(this);
                    }
                    unbindPopouts() {
                        this.observer = undefined;
                    }

                    onStart() {
                        this.bindPopouts()
                        BdApi.injectCSS(config.info.name, `
                            .user-tag-container {
                                display: flex;
                                background-color: var(--background-secondary-alt);
                                border-radius: 5px;
                                padding: 4px 6px;
                                margin: 0 4px 4px 0;
                            }
                            .user-tag-input {
                                background-color: var(--background-secondary-alt);
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
                                background-color: rgb(185, 187, 190);
                                cursor: pointer;
                            }
                           .btn-add-tag {
                                margin: 0 4px 4px 0;
                                padding: 4px 6px;
                                background-color: var(--background-secondary-alt);
                                border: none;
                                color: var(--interactive-active);
                                border-radius: 5px;
                           }
                           .user-tag-cancel-button-icon {
                                width: 10px;
                                top: 50%;
                                left: 50%;
                                fill: var(--interactive-normal);
                           }

                           .user-tag-body {
                                margin-bottom: 4px;
                           }
                           .user-tag-main {
                                display: block;
                                padding-top: 12px;
                            }
                            .user-tag-title {
                                font-size: 12px;
                                font-weight: 700;
                                font-family: var(--font-display);
                                color: var(--header-primary);
                                margin-bottom: 8px;
                                width: 100%;
                            }
                            .user-tag-add-button-icon {
                                width: 12px;
                                height: 12px;
                                fill: var(--background-primary);
                                cursor: pointer;
                            }
                        `);
                    }

                    onStop() {
                        this.unbindPopouts()
                        Patcher.unpatchAll();
                        BdApi.clearCSS(config.info.name);
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();
