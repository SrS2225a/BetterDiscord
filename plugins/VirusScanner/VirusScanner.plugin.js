/**
* @name VirusScanner
* @author Nyx
* @authorId 270848136006729728
* @version 1.0.0
* @license MIT
* @description Scans urls and files to detect threats using Hybrid Analysis
* @website https://fenriris.net/
* @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/VirusScanner.plugin.js
* @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/VirusScanner.plugin.js
*/

const config = {
    info: {
        name: "VirusScanner",
        authors: [
            {
                name: "Nyx",
                discord_id: "27048136006729728",
            }
        ],
        version: "1.0.0",
        description: "Scans urls and files to detect threats using Hybrid Analysis",
    },
    github: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins",
    github_raw: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/VirusScanner.plugin.js",
    main: "index.js",
    settingsPanel: [
        {
            type: "text",
            id: "apiKey",
            name: "API Key",
            note: "The API key you use from Hybrid Analysis. You can get one at https://www.hybrid-analysis.com/my-account?tab=%23api-key-tab",
        },
        {
            type: "switch",
            id: "fullReport",
            name: "Full Report",
            value: false,
            note: "When enabled, the plugin will do a full scan be default for any file or url to do an deep analysis on it"
        },
        {
            type: "switch",
            name: "Share Samples With Third Parties",
            note: "This setting sets whenever hybrid analysis's scan results can be shared with third-parties. The plugin itself does not share any data to parties",
            id: "thirdPartiesShare",
            value: false
        },
        {
            type: "number",
            name: "Quick Scan Polling Interval (in ms)",
            note: "How frequently the plugin should check in with the api for changes while scanning an file or url. I recommend somewhere around 5 to 15 seconds",
            id: "quickPollingInterval",
            value: 5000
        },
        {
            type: "number",
            name: "Full Scan Polling Interval (in ms)",
            note: "How frequently the plugin should check in with the api for changes while scanning an file or url. I recommend somewhere around 1.5 to 5 minutes for this one",
            id: "fullPollingInterval",
            value: 90000
        }
    ]
};

let defaultSettings = {
    fullReport: false,
    thirdPartiesShare: false,
    quickPollingInterval: 5000,
    fullPollingInterval: 90000,
    apiKey: ""
}

const { Data, ContextMenu, UI, Webpack, React, DOM, Net } = BdApi;
const SelectedChannelStore = Webpack.getModule((m) => m.getLastSelectedChannelId);
const MessageActions = Webpack.getModule((m) => m.sendMessage);

class QuickScan {
    constructor(box, url, settings, scanStates) {
        this.box = box;
        this.ScanResultState = scanStates;
        this.url = url;
        this.settings = settings;
        this.apiKey = settings.apiKey;
        this.start();
    }

    async start() {
        try {
            this.box.updateResult(this.ScanResultState.scanning);

            const submission = await this.submitUrl();

            if (!submission || !submission.sha256) {
                throw new Error("Hybrid Analysis did not return a SHA256 for scanning.");
            }

            const sha256 = submission.sha256;
            const jobId = submission.id;

            if (!submission.finished) {
                if (!jobId) throw new Error("Hybrid Analysis did not return a job ID for polling.");
                await this.waitUntilFinished(jobId);
            }

            const summary = await this.getSummary(sha256);

            if (!summary || !summary.verdict) {
                throw new Error("Scan finished, but no verdict available.");
            }

            const verdict = this.mapVerdict(summary.verdict);

            this.box.updateResult(verdict, {
                link: `https://www.hybrid-analysis.com/sample/${sha256}`,
                disableButtons: false
            });

        } catch (err) {
            console.error("[QuickScan]", err);
            this.box.updateResult(this.ScanResultState.error, {
                customText: `Error: ${err.message || "Unknown error occurred"}`,
                disableButtons: false
            });
        }
    }

    async submitUrl() {
        const formEncoded = new URLSearchParams({
            scan_type: "all",
            url: this.url,
            no_share_third_party: this.settings.thirdPartiesShare
        });
        const res = await Net.fetch("https://www.hybrid-analysis.com/api/v2/quick-scan/url", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "api-key": this.apiKey,
                "User-Agent": "DiscordVirusScanner/1.0",
                "accept": "application/json"
            },
            body: formEncoded.toString(),
            timeout: 10000
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.message) {
            const message = data?.message || "Quick scan submission failed";
            this.box.updateResult(this.ScanResultState.error, {
                customText: `Error: ${message}`,
                disableButtons: false
            });
            throw new Error(message);
        }

        return data;
    }

    async waitUntilFinished(jobId) {
        const maxAttempts = 50;
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < maxAttempts; i++) {
            await delay(this.settings.quickPollingInterval); // 6 seconds between attempts

            const res = await Net.fetch(`https://www.hybrid-analysis.com/api/v2/quick-scan/${jobId}`, {
                method: "GET",
                headers: {
                    "api-key": this.apiKey,
                    "User-Agent": "DiscordVirusScanner/1.0"
                },
                timeout: 10000
            });

            if (!res.ok) continue;

            const data = await res.json();;
            if (data.finished && data.sha256) {
                return data;
            }
        }

        throw new Error("Scan did not complete in time.");
    }

    async getSummary(sha256) {
        const res = await Net.fetch(`https://www.hybrid-analysis.com/api/v2/overview/${sha256}/summary`, {
            method: "GET",
            headers: {
                "api-key": this.apiKey,
                "User-Agent": "DiscordVirusScanner/1.0",
                "accept": "application/json"
            },
            timeout: 10000
        });

        if (!res.ok) {
            throw new Error("Failed to retrieve scan summary.");
        }

        return await res.json();
    }

    mapVerdict(verdict) {
        switch (verdict?.toLowerCase()) {
            case "malicious":
                return this.ScanResultState.malicious;
            case "suspicious":
                return this.ScanResultState.suspicious;
            case "no specific threat":
                return this.ScanResultState.clean;
            case "ambiguous":
                return this.ScanResultState.ambiguous
            default:
                return this.ScanResultState.unknown;
        }
    }
    }

class FullScan {
    constructor(box, url, settings, ScanResultState) {
        this.box = box;
        this.url = url;
        this.apiKey = settings.apiKey;
        this.settings = settings;
        this.ScanResultState = ScanResultState;

        this.start();
    }

    async start() {
        const environments = [
            { id: 100, name: "Windows 7 32-bit" },
            { id: 110, name: "Windows 7 64-bit" },
            { id: 120, name: "Windows 8.1 64-bit" },
            { id: 140, name: "Windows 11 64-bit" },
            { id: 160, name: "Windows 10 64-bit" },
            { id: 200, name: "Android Static" },
            { id: 310, name: "Linux (Ubuntu)" },
            { id: 400, name: "macOS" }
        ];

        let selectedEnv = this.guessEnvironmentFromUrl(this.url);
        const select = document.createElement("select");
        select.className = "virus-scanner-select";
        environments.forEach(env => {
            const opt = document.createElement("option");
            opt.value = env.id;
            opt.textContent = env.name;
            if (env.id === selectedEnv) opt.selected = true;
            select.appendChild(opt);
        });
        const paragraph = document.createElement("p");
        paragraph.textContent += "Choose an envoirment for sandbox analysis. If you don't know, you can leave it at the default option:";
        paragraph.style = "color: var(--text-normal)";
        this.box.result.appendChild(paragraph);
        this.box.result.appendChild(select);
        this.box.button1.textContent = "Contunie";
        this.box.button1.onclick = async () => {
            await this.startScan(this.url);
        };
    }

    async startScan(url) {
        try {
            this.box.button1.disabled = true;
            this.box.button2.disabled = true;
            const select = this.box.result.querySelector("select");
            const environmentId = select ? parseInt(select.value) : 160; // fallback to default
            this.box.result.innerHTML = "";
            const paragraph = document.createElement("p");
            this.box.result.appendChild(paragraph);

            const submission = await this.submitUrl(environmentId);

            const reportId = `${submission.sha256}:${submission.environment_id}`;

            await this.waitUntilFinished(reportId);

            const summary = await this.getSummary(reportId);

            this.box.container.remove(); // Clean UI
            this.showFullScanResultsModal(summary); // Show modal
        } catch (err) {
            this.updateBoxState(this.ScanResultState.error, err.message);
            this.box.button1.disabled = false;
            this.box.button2.disabled = false;
        }
    }

    guessEnvironmentFromUrl(url) {
        try {
            const ext = new URL(url).pathname.split(".").pop().toLowerCase();
            switch (ext) {
                case "apk": return 200;
                case "exe":
                case "dll": return 160;
                case "msi": return 140;
                case "sh":
                case "deb":
                case "elf": return 310;
                case "dmg": return 400;
                default: return 160;
            }
        } catch {
            return 160;
        }
    }

    showFullScanResultsModal(summary) {
        const React = BdApi.React;
        const verdictColor = {
            "no specific threat": "#4caf50",
            suspicious: "#ff9800",
            malicious: "#f44336",
            ambiguous: "#ffcc00",
            unknown: "#bbb"
        };

        const wrapSection = (label, elements) => [
            React.createElement("strong", {
                style: {
                    fontSize: "1.05em",
                    fontWeight: "600",
                    color: "var(--header-primary)",
                    borderTop: "1px solid var(--background-modifier-accent)",
                    display: "block",
                    marginTop: "10px",
                    marginBottom: "4px",
                    paddingTop: "6px",
                }
            }, label),
            ...elements
        ];

        const threatLevels = {
            0: {
                text: "Informative Indicators",
                bg: "var(--notice-background-info)",
                color: "var(--notice-text-info)"
            },
            1: {
                text: "Suspicious Indicators",
                bg: "var(--notice-background-warning)",
                color: "var(--notice-text-warning)"
            },
            2: {
                text: "Malicious Indicators",
                bg: "var(--notice-background-critical)",
                color: "var(--notice-text-critical)"
            }
        };

        const groupedSignatures = {};
        for (const sig of summary.signatures ?? []) {
            const level = sig.threat_level ?? 0;
            const category = sig.category || "Uncategorized";

            if (!groupedSignatures[level]) groupedSignatures[level] = {};
            if (!groupedSignatures[level][category]) groupedSignatures[level][category] = [];

            groupedSignatures[level][category].push(sig);
        }

        const signatureElements = Object.entries(groupedSignatures).map(([level, categories]) => {
            const total = Object.values(categories).reduce((a, b) => a + b.length, 0);
            var threatLevel = threatLevels[level];

            return React.createElement("div", {
                style: {
                    backgroundColor: "var(--background-secondary)",
                    marginBottom: "1em",
                    borderRadius: "0.5em",
                    overflow: "hidden",
                    border: "1px solid var(--background-modifier-accent)",
                    padding: "0.5em"
                }
            }, [
                React.createElement("h4", {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid var(--background-modifier-accent)",
                        paddingBottom: "0.5em",
                        marginBottom: "0.5em",
                        color: "var(--header-primary)"
                    }
                }, [
                    threatLevel.text,
                    React.createElement("span", {
                        style: {
                            background: threatLevel.bg,
                            padding: "0.25em 0.5em",
                            borderRadius: "1em",
                            fontSize: "0.9em",
                            color: threatLevel.color
                        }
                    }, `${total}`)
                ]),

                ...Object.entries(categories).map(([category, sigs]) =>
                    React.createElement("div", {
                        style: {
                            marginBottom: "0.75em"
                        }
                    }, [
                        React.createElement("div", {
                            style: {
                                fontWeight: "bold",
                                marginBottom: "0.25em",
                                color: "var(--header-secondary)"
                            }
                        }, category),

                        ...sigs.map((sig, i) => {

                            const definitionRow = (label, value) => React.createElement("div", {
                                style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "0.25em"
                                }
                            }, [
                                React.createElement("dt", {
                                    style: {
                                        marginRight: "0.5em",
                                        fontWeight: "bold",
                                        color: "var(--header-secondary)"
                                    }
                                }, label),
                                React.createElement("dd", {
                                    style: {
                                        margin: 0,
                                        color: "var(--text-normal)",
                                        fontWeight: 500,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word"
                                    }
                                }, value)
                            ]);

                            return React.createElement("details", {
                                key: `sig-${i}`,
                                style: {
                                    background: "var(--background-secondary-alt)",
                                    padding: "0.5em",
                                    borderRadius: "0.4em",
                                    marginBottom: "0.4em",
                                    cursor: "pointer"
                                }
                            }, [
                                React.createElement("summary", {
                                    style: {
                                        fontWeight: "bold",
                                        alignItems: "center",
                                        color: "var(--text-brand)",
                                        fontSize: "1em"
                                    }
                                }, sig.name),

                                React.createElement("dl", {
                                    style: {
                                        marginTop: "0.5em",
                                        fontSize: "0.9em"
                                    }
                                }, [
                                    sig.description && definitionRow("details", sig.description),
                                    sig.origin && definitionRow("source", sig.origin),
                                    sig.relevance && definitionRow("relevance", `${sig.relevance}/10`),
                                    sig.attck_id && sig.attck_id_wiki && definitionRow("ATT&CK ID",
                                        React.createElement("a", {
                                            href: sig.attck_id_wiki,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            style: { color: "var(--text-link)" }
                                        }, sig.attck_id)
                                    )
                                ].filter(Boolean))
                            ]);
                        })
                    ]))
            ]);
        });

        const modals = Webpack.getMangled(".modalKey?", {
            open: Webpack.Filters.byStrings(",instant:"),
            close: Webpack.Filters.byStrings(".onCloseCallback()")
        });

        modals.open(({ onClose }) => {
            return React.createElement("div", {
                className: "bd-modal-root bd-modal-large",
                style: { opacity: 1, transform: "scale(1)" }
            }, [
                // Header
                React.createElement("div", {
                    className: "bd-flex bd-flex-horizontal bd-flex-justify-start bd-flex-align-center bd-flex-no-wrap bd-modal-header",
                    style: { flex: "0 0 auto" }
                }, React.createElement("h1", {
                    className: "bd-header-primary bd-text-20 bd-text-strong"
                }, "Hybrid Analysis - Full Scan Results")),

                // Content
                React.createElement("div", {
                    className: "bd-modal-content bd-scroller-base bd-scroller-thin",
                    style: {
                        color: "var(--text-normal)",
                        maxHeight: "60vh",
                        overflowY: "auto",
                        padding: "12px",
                        background: "var(--background-primary)",
                        borderRadius: "6px"
                    }
                }, [
                    // Verdict & Metadata
                    ...wrapSection("🧠 Verdict", [
                        React.createElement("div", {
                            style: {
                                color: verdictColor[summary.verdict?.toLowerCase()] || "var(--text-normal)",
                                fontWeight: "bold"
                            }
                        }, `Verdict: ${summary.verdict || "Unknown"}`),
                        React.createElement("div", {}, `Threat Score: ${summary.threat_score ?? "N/A"}`),
                        React.createElement("div", {}, `Environment: ${summary.environment_description || summary.environment_id}`),
                        React.createElement("div", {}, `Analyzed At: ${summary.analysis_start_time ?? "N/A"}`)
                    ]),

                    // File Info
                    ...wrapSection("📁 File Information", [
                        React.createElement("div", {}, `Submit Name: ${summary.submit_name || "N/A"}`),
                        React.createElement("div", {}, `Type: ${summary.type || "?"}`),
                        React.createElement("div", {}, `Size: ${summary.size || "?"} bytes`),
                        React.createElement("div", {}, `SHA256: ${summary.sha256}`),
                        React.createElement("div", {}, `MD5: ${summary.md5}`),
                        React.createElement("div", {}, `SHA1: ${summary.sha1}`)
                    ]),

                    // MITRE
                    ...(summary.mitre_attcks?.length
                        ? wrapSection("🎯 MITRE ATT&CK™ Techniques Detection", summary.mitre_attcks.map((t, i) =>
                            React.createElement("div", { key: `mitre-${i}` },
                                `${t.tactic || "?"} → ${t.technique || "?"} (${t.attck_id})`)))
                        : []),
                    ...wrapSection("📌 Indicators", signatureElements)
                ]),

                // Footer
                React.createElement("div", {
                    className: "bd-flex bd-flex-reverse bd-flex-justify-start bd-flex-align-stretch bd-flex-no-wrap bd-modal-footer",
                    style: { flex: "0 0 auto", gap: "8px" }
                }, [
                    React.createElement("button", {
                        className: "bd-button bd-button-filled bd-button-color-brand bd-button-medium bd-button-grow",
                        type: "button",
                        onClick: () => onClose?.()
                    }, React.createElement("div", { className: "bd-button-content" }, "Close")),

                    React.createElement("button", {
                        className: "bd-button bd-button-link bd-button-color-primary bd-button-medium bd-button-grow",
                        type: "button",
                        onClick: () => {
                            window.open(`https://www.hybrid-analysis.com/sample/${summary.sha256}`, "_blank", "noopener,noreferrer");
                            onClose?.();
                        }
                    }, React.createElement("div", { className: "bd-button-content" }, "View On Hybrid Analysis"))
                ])
            ]);
        });
    }


    updateBoxState(stateEnum, customText = null) {
        const message = customText || stateEnum.defaultText;
        this.box.result.textContent = `${stateEnum.emoji} ${message}`;
        this.box.result.style.color = stateEnum.color;
    }

    async submitUrl(environmentId) {
        const formData = new URLSearchParams({
            url: this.url,
            environment_id: environmentId.toString(),
            no_share_third_party: this.settings.thirdPartiesShare
        });

        this.updateBoxState(this.ScanResultState.scanning);

        const res = await Net.fetch("https://www.hybrid-analysis.com/api/v2/submit/url", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "api-key": this.apiKey,
                "User-Agent": "DiscordVirusScanner/1.0"
            },
            body: formData.toString(),
            timeout: 10000
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.message) {
            throw new Error(data?.message || "Full scan submission failed.");
        }

        return data;
    }

    async waitUntilFinished(reportId) {
        const maxAttempts = 50;
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        for (let i = 0; i < maxAttempts; i++) {
            const res = await Net.fetch(`https://www.hybrid-analysis.com/api/v2/report/${reportId}/state`, {
                method: "GET",
                headers: {
                    "api-key": this.apiKey,
                    "User-Agent": "DiscordVirusScanner/1.0"
                },
                timeout: 10000
            });

            const data = await res.json();
            const state = data?.state?.toUpperCase();

            switch (state) {
                case "IN_QUEUE":
                    this.updateBoxState(this.ScanResultState.queue);
                    break;
                case "IN_PROGRESS":
                    this.updateBoxState(this.ScanResultState.scanning);
                    break;
                case "SUCCESS":
                    this.updateBoxState(this.ScanResultState.clean, "Scan completed. Loading results...");
                    return;
                case "ERROR":
                    this.updateBoxState(this.ScanResultState.error, `Unexpected scan state: ${data.error}`);
                default:
                    this.updateBoxState(this.ScanResultState.error, `Unexpected scan state: ${state}`);
                    throw new Error(`Unexpected scan state: ${state}`);
            }
            await delay(this.settings.fullPollingInterval);
        }

        throw new Error("Scan did not finish in time.");
    }

    async getSummary(reportId) {
        const res = await Net.fetch(`https://www.hybrid-analysis.com/api/v2/report/${reportId}/summary`, {
            method: "GET",
            headers: {
                "api-key": this.apiKey,
                "User-Agent": "DiscordVirusScanner/1.0",
                "accept": "application/json"
            },
            timeout: 10000
        });

        if (!res.ok) throw new Error("Failed to get scan summary.");
        return await res.json();
    }
}

class VirusScanner {
    constructor() {
        this._config = config;
        this.settings = Data.load(this._config.info.name, "settings");
        this.scanning = []
        this.ScanResultState = {
            queue: {
                emoji: "⏳",
                defaultText: "Waiting in queue...",
                color: "#999"
            },
            scanning: {
                emoji: "🔍",
                defaultText: "Scanning… hang tight!",
                color: "#999"
            },
            clean: {
                emoji: "✅",
                defaultText: "No threats detected. All clear!",
                color: "#4caf50"
            },
            suspicious: {
                emoji: "⚠️",
                defaultText: "Potentially suspicious behavior found.",
                color: "#ff9800"
            },
            malicious: {
                emoji: "🚨",
                defaultText: "Threat detected! This file may be dangerous.",
                color: "#f44336"
            },
            ambiguous: {
                emoji: "🤔",
                defaultText: "Scan result is inconclusive. Use caution.",
                color: "#ffcc00"
            },
            unknown: {
                emoji: "❓",
                defaultText: "Unable to determine scan result.",
                color: "#bbb"
            },
            error: {
                emoji: "❗",
                defaultText: "Scan failed. An error occurred.",
                color: "#f44336"
            }
        };
    }

    start() {
        const pluginInstance = this;

        DOM.addStyle(this._config.info.name, `
            .virus-scanner-box {
                margin-top: 8px;
                padding: 8px;
                border-radius: 4px;
                background-color: transparent;
            }

            .virus-scanner-separator {
                margin-bottom: 6px;
                border: none;
                border-top: 1px solid #555;
            }

            .virus-scanner-title {
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 6px;
                color: #ddd;
            }

            .virus-scanner-result {
                font-size: 0.9em;
                margin-bottom: 6px;
            }

            .virus-scanner-button {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                background-color: var(--button-filled-brand-background);
                color: white;
                font-weight: 500;
                margin-right: 6px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .virus-scanner-select {
                margin-bottom: 6px;
                padding: 6px;
                background-color: var(--background-secondary);
                color: var(--text-normal);
                border-radius: 4px;
                border: 1px solid var(--background-tertiary);
            }

            .virus-scanner-button:hover:not(:disabled) {
                background-color: var(--button-filled-brand-background-hover);
            }

            .virus-scanner-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Secondary variant */
            .virus-scanner-button-secondary {
                background-color: var(--button-secondary-background);
            }

            .virus-scanner-button-secondary:hover:not(:disabled) {
                background-color:var(--button-secondary-background-hover);
            }

            /* Danger variant */
            .virus-scanner-button-danger {
                background-color: var(--button-danger-background);
            }

            .virus-scanner-button-danger:hover:not(:disabled) {
                background-color:var(--button-danger-background-hover);
            }
        `);

        this.settings = Data.load(this._config.info.name, "settings") || defaultSettings;
        if (Data.load(this._config.info.name, "settings") == null) this.saveAndUpdate();
        if (!this.settings.confimedPlugin) {
            let apiKey = this.settings.apiKey || "";
            UI.showConfirmationModal("Third-pary notice", React.createElement("div", { style: { color: "var(--text-normal)" } },
                React.createElement("p", null,
                    "To analyze files and urls, this plugin uses a third-party malware scanning service. Files scanned with this plugin will be sent to ",
                    React.createElement("a", {
                        href: "https://www.hybrid-analysis.com/",
                        target: "_blank",
                        rel: "noreferrer"
                    }, "https://www.hybrid-analysis.com"),
                    "."
                ),
                React.createElement("label", {
                    style: { fontWeight: "bold", display: "block", marginTop: "10px" }
                }, "Hybrid Analysis API Key:"),
                React.createElement("input", {
                    type: "text",
                    placeholder: "Enter your API key here",
                    defaultValue: apiKey,
                    style: {
                        width: "98%",
                        marginTop: "4px",
                        padding: "6px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "var(--background-secondary)",
                        color: "color: var(--text-normal)"
                    },
                    onChange: (e) => apiKey = e.target.value
                }),
                React.createElement("small", {
                    style: { display: "block", marginTop: "6px", color: "var(--text-normal)" }
                }, "You can get an API key at ",
                    React.createElement("a", {
                        href: "https://www.hybrid-analysis.com/my-account?tab=%23api-key-tab",
                        target: "_blank",
                        rel: "noreferrer"
                    }, "your Hybrid Analysis account settings"),
                    "."
                )
            ), {
                confirmText: "I Understand",
                cancelText: "Disable Plugin",
                onConfirm: () => {
                    this.settings.confimedPlugin = true;
                    this.settings.apiKey = apiKey.trim();
                    this.saveAndUpdate();
                },
                onCancel: () => {
                    BdApi.disable("VirusScanner");
                }
            });
        }

        this.checkForChangelog();

        this.handleMessageContextMenu = ContextMenu.patch("message", (menu, props) => {
            var url = this.isValidUrl(props.target.href || props.target.innerText);
            if (url) {
                var menuChildren = menu.props.children
                if (menuChildren) {
                    var contextMenuItem = ContextMenu.buildItem({
                        label: "Scan Link", action: () => {
                            if (this.scanning.includes(url.href)) {
                                UI.showToast("This file is already being scanned, please be patient.")
                            } else {
                                this.scanning.push(url.href) // Prevents the same file from being scanned twice while the scan is in progress

                                if (!this.settings?.fullReport) {
                                    var box = this.setVirusScannerBoxQuick(props.target, url.href);
                                    if (box) {
                                        new QuickScan(box, url.href, this.settings, this.ScanResultState)
                                    }
                                } else {
                                    var box = this.setVirusScannerBoxFull(props.target);
                                    if (box) {
                                        new FullScan(box, url.href, this.settings, this.ScanResultState);
                                    }
                                }

                                const index = this.scanning.indexOf(url.href);
                                if (index !== -1) {
                                    this.scanning.splice(index, 1);
                                }
                            }
                        }
                    })
                    menuChildren.props.children[7].props.children.push(contextMenuItem);
                }
            }
        });


        BdApi.Patcher.before("attchmentScan", BdApi.Webpack.getByStrings("filenameLinkWrapper,children:", { defaultExport: false }), "Z", (that, args) => {
            const props = args?.[0];

            if (!props || typeof props.renderAdjacentContent !== "function") {
                return;
            }

            const originalRender = props.renderAdjacentContent;

            props.renderAdjacentContent = function () {
                const result = originalRender.apply(this, arguments);

                if (BdApi.React.isValidElement(result) && String(result.type).includes("1WjMbG")) {
                    if (!originalType) {
                        originalType = result.type;
                    }
                    result.type = scanButton(pluginInstance, props.url);
                }

                return result;
            };
        });

        let originalType;
        function scanButton(pluginInstance, url) {
            return function PatchedComponent(props) {
                const res = originalType(props);

                try {
                    const children = res?.props?.children?.[0]?.props?.children;

                    if (Array.isArray(children)) {
                        const icon = BdApi.React.createElement(
                            "svg",
                            {
                                width: "16",
                                height: "16",
                                viewBox: "0 0 512 512",
                                className: "hoverButton__06ab4",
                                fill: "none",
                                xmlns: "http://www.w3.org/2000/svg",
                                style: {
                                    marginLeft: "6px",
                                    verticalAlign: "middle",
                                    fill: "currentColor"
                                },
                                onClick: () => {
                                    if (pluginInstance.scanning.includes(url)) {
                                        UI.showToast("This file is already being scanned, please be patient.")
                                    } else {
                                        pluginInstance.scanning.push(url) // Prevents the same file from being scanned twice while the scan is in progress                
                                        if (!pluginInstance.settings?.fullReport) {
                                            var box = pluginInstance.setVirusScannerBoxQuick(res.props.children[1].props.ref.current.parentNode, url);
                                            if (box) {
                                                new QuickScan(box, url, pluginInstance.settings, pluginInstance.ScanResultState)
                                            }
                                        } else {
                                            var box = pluginInstance.setVirusScannerBoxFull(res.props.children[1].props.ref.current);
                                            if (box) {
                                                new FullScan(box, url, pluginInstance.settings, pluginInstance.ScanResultState);
                                            }
                                        }

                                        const index = pluginInstance.scanning.indexOf(url);
                                        if (index !== -1) {
                                            pluginInstance.scanning.splice(index, 1);
                                        }
                                    }
                                }
                            },
                            BdApi.React.createElement("path", {
                                d: "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z",
                                fill: "currentColor"
                            })
                        );

                        children.push(icon);
                    }
                } catch (e) {
                    console.error("[VirusScanner] Failed to inject icon:", e);
                }

                return res;
            };
        }
    }

    stop() {
        this.handleMessageContextMenu();
        BdApi.Patcher.unpatchAll("attachmentScan");
    }

    isValidUrl(url) {
        try {
            return new URL(url);
        } catch {
            return false;
        }
    }

    setVirusScannerBoxQuick(target, url) {
        const parent = target?.parentNode.parentNode;
        if (!parent || !(parent instanceof HTMLElement)) return;

        if (parent.querySelector(".virus-scanner-box")) return;

        const container = document.createElement("div");
        container.className = "virus-scanner-box";

        const hr = document.createElement("hr");
        hr.className = "virus-scanner-separator";
        container.appendChild(hr);

        const title = document.createElement("div");
        title.className = "virus-scanner-title";
        title.textContent = "Virus Scanner Results";
        container.appendChild(title);

        const result = document.createElement("div");
        result.className = "virus-scanner-result";
        container.appendChild(result);

        const button1 = document.createElement("button");
        button1.className = "virus-scanner-button";
        button1.textContent = "View On Hybrid Analysis";
        button1.disabled = true;
        button1.onclick = () => {
            if (button1.dataset.url) {
                const hybridLink = button1.dataset.url;
                window.open(hybridLink, "_blank");
            } else {
                UI.showToast("No URL to scan.");
            }
        };

        const button2 = document.createElement("button");
        button2.className = "virus-scanner-button virus-scanner-button-secondary";
        button2.textContent = "Convert To Full Scan";
        button2.addEventListener("click", () => {
            container.remove();
            var box = this.setVirusScannerBoxFull(target);
            if (box) {
                new FullScan(box, url, this.settings, this.ScanResultState);
            }
        })

        const button3 = document.createElement("button");
        button3.className = "virus-scanner-button virus-scanner-button-danger";
        button3.textContent = "Close";
        button3.addEventListener("click", () => {
            container.remove();
        })

        container.appendChild(button1);
        container.appendChild(button2);
        container.appendChild(button3);

        parent.appendChild(container);

        return {
            container,
            resultElement: result,
            buttonQuickScan: button1,
            buttonFullScan: button2,

            updateResult(state, options = {}) {
                const { customText, link, disableButtons = true } = options;

                if (typeof state === "string") {
                    result.textContent = state;
                    result.style.color = customText || "#ccc"; // fallback to default color if needed
                } else {
                    const message = customText || state.defaultText;
                    result.textContent = `${state.emoji} ${message}`;
                    result.style.color = state.color;
                }

                if (link) {
                    button1.dataset.url = link;
                    button1.disabled = disableButtons;
                } else {
                    delete button1.dataset.url;
                    button1.disabled = true;
                }

                button2.disabled = disableButtons;
            }
        };

    }

    setVirusScannerBoxFull(target) {
        const parent = target?.parentNode.parentNode;
        if (!parent || !(parent instanceof HTMLElement)) return;

        if (parent.querySelector(".virus-scanner-box")) return;

        const container = document.createElement("div");
        container.className = "virus-scanner-box";

        const hr = document.createElement("hr");
        hr.className = "virus-scanner-separator";
        container.appendChild(hr);

        const title = document.createElement("div");
        title.className = "virus-scanner-title";
        title.textContent = "Virus Scanner Full Report";
        container.appendChild(title);

        const result = document.createElement("div");
        result.className = "virus-scanner-result";
        container.appendChild(result);

        const button1 = document.createElement("button");
        button1.className = "virus-scanner-button";

        const button2 = document.createElement("button");
        button2.className = "virus-scanner-button virus-scanner-button-danger";
        button2.textContent = "Close";
        button2.addEventListener("click", () => {
            container.remove();
        })

        container.appendChild(button1);
        container.appendChild(button2);

        parent.appendChild(container);

        return {
            container,
            result,
            button1,
            button2
        }
    }

    getSettingsPanel() {
        for (const setting of this._config.settingsPanel) {
            if (this.settings[setting.id] !== undefined) {
                setting.value = this.settings[setting.id];
            }
        }

        return UI.buildSettingsPanel({
            settings: this._config.settingsPanel,
            onChange: (category, id, value) => {
                this.settings[id] = value;
                this.saveAndUpdate();
            },
        })
    }

    saveAndUpdate() {
        Data.save(this._config.info.name, "settings", this.settings);
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
                    title: "VirusScanner Changelog",
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
