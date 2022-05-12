/**
 * @name UserTags
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Allows you to add custom tags to users and search byt them.
 * @website https://github.com/SrS2225a
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
            version: "1.1.0",
            description: "Allows you to add custom tags to users. You can use these tags to filter users by their tags."
        },
        github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/UserTags/UserTags.plugin.js",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js",
        changelog: [
            {
                title: "Fixes",
                items: ["Added the ability to add tag to user through their user profile."]
            }, {
                title: "Improvements",
                items: ["Added more advanced search options. You can now search by logical operators such as AND, OR, NOT, and more."]
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
                const { Patcher, WebpackModules, DiscordModules, DOMTools, PluginUtilities } = Library;
                const {React} = DiscordModules;
                const Roleobj = WebpackModules.find((m) => m.default?.displayName === "UserPopoutBody");
                const Profileobj = WebpackModules.find((m) => m.default?.displayName === "UserInfoBase");
                // const FriendsStore = WebpackModules.find((m) => m.default?.getName() === "FriendsStore");
                // const PeopleList = WebpackModules.find((m) => m.default?.displayName === "PeopleList");
                const QuickSwitcher = WebpackModules.find((m) => m.default?.displayName === "QuickSwitcherConnected");


                return class UserTags extends Plugin {
                    onStart() {
                        let userPopoutPatched = false
                        let querySize = ""

                        function createTagPending(userId, tag = null) {
                            const input = DOMTools.createElement("<input class='.input-change-tag' type='text'>");
                            input.style.cssText = "margin: 0 5px 5px 0; padding: 0px; width: 30%; border: 1.5px solid #000; background: none; font-size: 14px; color: #fffffa;";
                            const element = document.querySelector(".btn-add-tag");

                            if (tag) {
                                input.value = tag;
                            }
                            if (element) {
                                element.parentElement.insertBefore(input, element);
                                input.focus();
                                userPopoutPatched = true
                            }

                            const tagContainer = document.querySelector(".bodyInnerWrapper-2bQs1k") || document.querySelector(".infoScroller-1QMpon");
                            input.addEventListener("input", (e) => {
                                const data = PluginUtilities.loadData(config.info.name, "UserData");
                                const indexOf = Object.values(tagContainer.querySelectorAll("input")).indexOf(e.target);
                                // if user is not in data yet, add it
                                if (!data[userId]) data[userId] = [];
                                data[userId][indexOf] = input.value;
                                input.value = e.target.value.replace(/\s/g, "");
                                PluginUtilities.saveData(config.info.name, "UserData", data);
                                if (e.target.value.length > 0) {
                                    input.style.border = "1.5px solid #000";
                                    input.style.background = "#2f3136";
                                    input.style.color = "#ffffff";
                                }
                            });

                            input.addEventListener("keydown", (e) => {
                                // key code 8 is backspace
                                if (e.ctrlKey && e.keyCode === 8) {
                                    const data = PluginUtilities.loadData(config.info.name, "UserData");
                                    const indexOf = Object.values(tagContainer.querySelectorAll("input")).indexOf(e.target);
                                    data[userId].splice(indexOf, 1);
                                    if (data[userId].length === 0) {
                                        delete data[userId];
                                    }
                                    PluginUtilities.saveData(config.info.name, "UserData", data);
                                    // remove the input
                                    input.remove();
                                }
                            });
                        }

                        function runTags(props, ret) {
                            // check if the html code was already added using DOMTools
                            if (!document.querySelector(".userTagContainer")?.children) userPopoutPatched = false;
                            const addIcon = React.createElement("svg", {
                                viewBox: "2 0 20 20",
                                height: "24",
                                width: "24",
                                style: {
                                    cursor: "pointer",
                                    width: "12px",
                                    height: "12px"
                                }
                            }, React.createElement("path", {
                                fill: "currentColor",
                                d: "M20 11.1111H12.8889V4H11.1111V11.1111H4V12.8889H11.1111V20H12.8889V12.8889H20V11.1111Z"
                            }));
                            const tagsHeading = React.createElement("p", {
                                style: {
                                    margin: "8px 0px 6px 0px",
                                    padding: "0px",
                                    fontSize: "14px",
                                    color: "var(--header-secondary)",
                                    width: "100%",
                                    "font-weight": "700",
                                    "font-size": "12px",
                                    "font-family": "var(--font-display)"
                                }
                            }, "TAGS");
                            let setupUSerTags = React.createElement(React.Fragment, {
                                    key: "userTags"
                                },
                                React.createElement("div", {
                                    className: "userTagContainer base-21yXnu size12-oc4dx4",
                                    style: {
                                        display: "flex",
                                        flexDirection: "row",
                                        flexWrap: "wrap",
                                        justifyContent: "space-between",
                                        alignItems: "center"}
                                }, tagsHeading),
                                React.createElement("button", {
                                    className: "btn-add-tag",
                                    style: {
                                        "margin": "0 6px 6px 0",
                                        "padding": "2px 3px",
                                        "background-color": "#2f3136",
                                        "color": "#ffffff",
                                        "font-size": "12px",
                                        "font-weight": "700",
                                        "border": "#ffffff 2px solid",
                                    },
                                    onClick: () => {
                                        createTagPending(props.user.id)
                                    }
                                }, addIcon)
                            )


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
                            return setupUSerTags
                        }

                        Patcher.after(QuickSwitcher, "default", (thisObject, args, ret) => {
                            // use doom tools to get query instead so that the not (!) gets voided
                            let query = document.querySelector(".input-3r5zZY")?.value;
                            let users = ret.props.results = [];
                            if (query.startsWith("&")) {
                                query = query.replace("&", "");
                                const data = PluginUtilities.loadData(config.info.name, "UserData");
                                const logicalOperators = query.split(/\s*(&&|\|\||!|\(|\))\s*/);
                                let userIds = []

                                if (logicalOperators.length === 1) {
                                    userIds = Object.keys(data).filter(userId => data[userId].some(tag => tag.includes(query)));
                                } else {
                                    // adds support for logical operators such as &&, ||, and !
                                    for (let i = 0; i < logicalOperators.length; i++) {
                                        if (logicalOperators[i] === "&&") {
                                            const paramaters = [logicalOperators[i - 1], logicalOperators[i + 1]];
                                            userIds.push(Object.keys(data).filter(userId => data[userId].some(tag => tag.includes(paramaters[0] && paramaters[1]))));
                                        } else if (logicalOperators[i] === "||") {
                                            const paramaters = [logicalOperators[i - 1], logicalOperators[i + 1]];
                                            userIds.push(Object.keys(data).filter(userId => data[userId].some(tag => tag.includes(paramaters[0] || paramaters[1]))));
                                        } else if (logicalOperators[i] === "!") {
                                            const paramaters = [logicalOperators[i + 1]];
                                            userIds.push(Object.keys(data).filter(userId => data[userId].some(tag => !tag.includes(paramaters[0]))));
                                        }
                                    }
                                }

                                const values = userIds.flat();
                                for (const id of values) {
                                    // do not add the user to the list if they are already in the list
                                    if (users.some(user => user.record.id === id)) continue
                                    const user = DiscordModules.UserStore.getUser(id)
                                    users.push({
                                        comparator: user.username,
                                        record: user,
                                        type: "USER"
                                    })
                                }
                            }
                        })


                        // Patcher.after(PeopleList,'default',(_,args,ret)=>{
                        //     let query = ret.props.children[0].props.query
                        //     let users = ret.props.children[2].props
                        //     let filterUsers = ret.props.children[1].props.children.props.title
                        //
                        //     if (query.startsWith("&")) {
                        //         query = query.replace("&", "");
                        //         if (!users.statusSections) {
                        //             users.statusSections = [[]]
                        //         }
                        //
                        //         const data = PluginUtilities.loadData(config.info.name, "UserData");
                        //         const friends = DiscordModules.RelationshipStore.getFriendIDs()
                        //         const userIds = Object.keys(data).filter(key => data[key].some(tag => tag.includes(query)));
                        //
                        //         if (userIds.length > 0){
                        //             delete users.children
                        //             delete users.className
                        //         }
                        //
                        //         function addUser(activity, status, user) {
                        //             users.statusSections[0].push({
                        //                 activities: activity,
                        //                 status: status,
                        //                 user: user
                        //             })
                        //         }
                        //
                        //         for (const id of userIds) {
                        //             // filter out friends depending on what tab was selected
                        //             if (filterUsers.includes("Blocked")) {
                        //                 if (DiscordModules.RelationshipStore.isBlocked(id)) {
                        //                     addUser(DiscordModules.UserStatusStore.getActivities(id), DiscordModules.UserStatusStore.getStatus(id), DiscordModules.UserStore.getUser(id))
                        //                 }
                        //             } else if (filterUsers.includes("Pending")) {
                        //                 if (DiscordModules.RelationshipStore.isPending(id)) {
                        //                     addUser(DiscordModules.UserStatusStore.getActivities(id), DiscordModules.UserStatusStore.getStatus(id), DiscordModules.UserStore.getUser(id))
                        //                 }
                        //             } else if (filterUsers.includes("Online")) {
                        //                 if (DiscordModules.UserStatusStore.getStatus(id) !== "offline" && friends.includes(id)) {
                        //                     addUser(DiscordModules.UserStatusStore.getActivities(id), DiscordModules.UserStatusStore.getStatus(id), DiscordModules.UserStore.getUser(id))
                        //                 }
                        //             } else {
                        //                 if (friends.includes(id)) {
                        //                     addUser(DiscordModules.UserStatusStore.getActivities(id), DiscordModules.UserStatusStore.getStatus(id), DiscordModules.UserStore.getUser(id))
                        //                 }
                        //             }
                        //         }
                        //
                        //         // get rid of duplicates from users and userIds
                        //         users.statusSections[0] = users.statusSections[0].filter((user, index, self) => self.findIndex(u => u.user.id === user.user.id) === index);
                        //     }
                        // })

                        Patcher.after(Profileobj, "default", (thisObject, [props], ret) => {
                            const setupUserTags = runTags(props, ret)
                            ret.props.children.splice(1, 0,
                                setupUserTags
                            )
                        })

                        Patcher.after(Roleobj, "default", (_, [props], ret) => {
                            const setupUserTags = runTags(props, ret)
                            ret.props.children.splice(3, 0,
                                setupUserTags
                            )
                        })
                    }


                    onStop() {
                        Patcher.unpatchAll();
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();


