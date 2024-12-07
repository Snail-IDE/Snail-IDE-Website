<script>
    import { onMount } from "svelte";
    import Authentication from "../resources/authentication.js";
    import ProjectApi from "../resources/projectapi.js";
    import censor from "../resources/basiccensorship.js";
    import VRHandler from "../vr";
    const ProjectClient = new ProjectApi();

    // Static values
    import LINK from "../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import StoreItem from "$lib/RandomShoppingItem/ShoppingItem.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import UserDisplay from "$lib/UserDisplay/Display.svelte";
    import Project from "$lib/Project/Project.svelte";
    import Alert from "$lib/Alert/Alert.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../resources/translations.js";
    import Language from "../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../icons/Penguin/confused.svelte";
    let loggedIn = null;
    let langDecided = false;
    let currentLang = "en";

    let ghcommits = [];
    let myFeed = [];
    let updates = [];
    let feedIsEmpty = false;
    let ghcommitsFailed = false;
    let ghcommitsLoaded = false;
    let projectsLoaded = false;
    let projectsFailed = false;
    let spookyFailed = false;

    let projects = {
        today: [],
        featured: [],
        spooky: []
    };

    let thingyActive = false;
    // do the thingy
    $: {
        if (!loggedIn) {
            // 1:99 chance that we will play the video
            // imediatly rather then after four hours
            thingyActive = Math.random() * 100 <= 1;
            setTimeout(() => {
                thingyActive = true;
            }, 1.44e7);
        } else console.log("you dont get to see the thingy :trol:");
    }

    const getAndUpdateMyFeed = async () => {
        const feed = await ProjectClient.getMyFeed();
        if (feed.length <= 0) {
            feedIsEmpty = true;
        }
        myFeed = feed;
    };
    const getFeedText = (type, author, content) => {
        switch (type) {
            case "follow":
                return TranslationHandler.text(
                    "feed.following",
                    currentLang,
                ).replace("$1", author);
            case "upload":
                return TranslationHandler.text("feed.uploaded", currentLang)
                    .replace("$1", author)
                    .replace("$2", content.name);
            case "remixed":
                return TranslationHandler.text("feed.remixed", currentLang)
                    .replace("$1", author)
                    .replace("$2", content.name);
            case "posted":
                return TranslationHandler.text(
                    "feed.posted",
                    currentLang,
                ).replace("$1", author);
        }
    };
    const getFeedUrl = (type, author, content) => {
        switch (type) {
            case "upload":
            case "remixed":
                return `https://snail-ide.js.org//#${content.id}`;
            case "posted":
                return `/profile?user=${author}&post=${content.id}`;
            default:
                return `/profile?user=${author}`;
        }
    };

    onMount(async () => {
        const projectId = Number(location.hash.replace("#", ""));
        if (!isNaN(projectId) && projectId != 0) {
            location.href = `https://snail-ide.js.org//#${projectId}`;
            return;
        }

        fetch(`${LINK.commitsHistory}`)
            .then((res) => {
                res.json()
                    .then((commits) => {
                        ghcommits = commits;
                        ghcommitsLoaded = true;
                    })
                    .catch(() => {
                        ghcommitsFailed = true;
                    });
            })
            .catch(() => {
                ghcommitsFailed = true;
            });

        ProjectApi.getMaxProjects(15, false, true).then((projs) => {
            projects.today = projs;
        });
        ProjectApi.getMaxProjects(15, true, false)
            .then((projs) => {
                projects.featured = projs;
                projectsLoaded = true;
            })
            .catch(() => {
                projectsFailed = true;
            });
        fetch(`${LINK.projects}api/projects/search?page=0&includes=%23spooky`)
            .then((response) => {
                response
                    .json()
                        .then((projectListResult) => {
                            projects.spooky = projectListResult.projects;
                        })
                        .catch(() => {
                            spookyFailed = true;
                        });
            })
            .catch(() => {
                spookyFailed = true;
            });
    });

    // login code below
    let loggedInUsername = "";
    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    loggedInUsername = username;
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    getAndUpdateMyFeed();
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        myFeed = [];
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    loggedInUsername = username;
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    getAndUpdateMyFeed();
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        langDecided = true;
    });

    let selectedFrontTabSelected = "new";

    export async function load({ params, query }) {
        // Check if the current domain is snail-ide.vercel.app
        if (window.location.hostname === "snail-ide.vercel.app") {
            // Redirect to snail-ide.com
            window.location.href =
                "https://snail-ide.com" +
                window.location.pathname +
                window.location.search;
        }
    }

    const isItAprilFoolDay = () => {
        var now = new Date();
        return now.getMonth() == 3 && now.getDate() == 1;
    };
    const isItSpooky = () => {
        var now = new Date();
        return now.getMonth() == 9;
    };
</script>

<head>
    <title>Snail IDE - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />
    <Alert
        onlyShowID={"donatee:_1"}
        text={"Snail IDE is a powerful free-to-use visual coding website/game engine based off of PenguinMod."}
        textBreakup={true}
        textColor={"white"}
        hasImage={true}
        imgSrc={"/happy.svg"}
        imgAlt={":D"}
        hasButton={true}
        buttonText={"Try it"}
        buttonHref={"https://snail-ide.js.org/editor.html"}
    />
    <Alert
        onlyShowID={"merge-upstream:_1"}
        text={"We are porting Snail IDE to be based on modern PenguinMod Studio, and we are releasing a seperate website for you to test your projects with."}
        textBreakup={true}
        backColor={"green"}
        textColor={"white"}
        hasButton={true}
        buttonText={"Test"}
        buttonHref={"https://forum.snail-ide.com/d/174-snail-ide-editor-modern-penguinmod-studio-snail-ide-update-in-development"}
    />

    {#if loggedIn === false}
        <div class="section-info">
            <div style="margin-left: 8rem;">
                <h1>
                    <LocalizedText
                        text="Block-based coding with tons of capabilities"
                        key="home.introduction1"
                        lang={currentLang}
                    />
                </h1>
                <h1>
                    Built off of <a
                        href="https://scratch.org"
                        style="color:orange;">Scratch</a
                    >,
                    <a href="https://turbowarp.org" style="color:red;"
                        >TurboWarp</a
                    >, and
                    <a href="https://penguinmod.com" style="color:cyan;"
                        >PenguinMod</a
                    >
                </h1>
                <Button
                    label="<img src='/tryit.svg' width='32px' style='margin-right:8px'></img>"
                    link={LINK.editor}
                >
                    {#if !thingyActive}
                        <LocalizedText
                            text="Try it out "
                            key="home.tryout"
                            lang={currentLang}
                        />
                    {:else}
                        EEEAAAOOO
                    {/if}
                </Button>
            </div>

            {#if !thingyActive}
                <video
                    width="426.666667"
                    height="240"
                    autoplay="true"
                    muted="true"
                    loop="true"
                    class="example-video"
                >
                    <source src="/example.mp4" type="video/mp4" />
                    <track kind="captions" />
                </video>
            {:else}
                <iframe
                    src="/eao.html"
                    title="The Thingy"
                    width="426.666667"
                    height="240"
                    frameborder="0"
                    class="example-video"
                />
            {/if}
        </div>

        {#if langDecided && currentLang != "en" && loggedIn === false}
            <div class="section-language-warning">
                <img
                    src="/warning.png"
                    draggable="false"
                    style="height: 24px; margin-right: 6px"
                    alt="Warning"
                />
                <p>
                    <LocalizedText
                        text="You will never see this text. If you do, please tell me how."
                        key="translation.warning"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}

        <div class="section-links">
            <Button link={LINK.packager}>
                <LocalizedText
                    text="Packager"
                    key="home.footer.sections.website.packager"
                    lang={currentLang}
                />
            </Button>
            <Button link={LINK.credits}>
                <LocalizedText
                    text="Credits"
                    key="home.footer.sections.website.credits"
                    lang={currentLang}
                />
            </Button>
            <Button link={LINK.docs}>
                <LocalizedText
                    text="Docs"
                    key="home.footer.sections.website.docs"
                    lang={currentLang}
                />
            </Button>
            <Button label="GitHub" link={LINK.github} />
        </div>
    {/if}

    {#if langDecided && currentLang != "en" && loggedIn !== false}
        <div class="section-language-warning">
            <img
                src="/warning.png"
                draggable="false"
                style="height: 24px; margin-right: 6px"
                alt="Warning"
            />
            <p>
                <LocalizedText
                    text="PenguinMod is made by English-speaking developers. Expect minor issues and sorry for any translation errors."
                    key="translation.warning"
                    lang={currentLang}
                />
            </p>
        </div>
    {/if}

    <div class="section-categories">
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.whatsnew",
                currentLang,
            )}
            seemore={`https://github.com/snail-ide/`}
        >
            <div class="category-content">
                <UserDisplay
                    link="https://snail-ide.com/spooky.mp4"
                    userLink={`https://github.com/nmsderp`}
                    text="Try out this new Halloween feature!"
                    author="nmsderp"
                    image="https://avatars.githubusercontent.com/u/130254323?v=4"
                />
                <a
                    target="_blank"
                    href="https://snail-ide.com/spooky.mp4"
                >
                    <button class="update-image-wrapper">
                        <img
                            src="https://snail-ide.com/spookynews.PNG"
                            alt="NCS is on Snail IDE!"
                            class="update-image"
                        />
                    </button>
                </a>
            </div>
        </ContentCategory>

        {#if loggedIn && selectedFrontTabSelected === "feed"}
            <ContentCategory
                header={TranslationHandler.text(
                    "home.sections.feed",
                    currentLang,
                )}
            >
                <div class="category-content">
                    {#if myFeed.length > 0}
                        {#each myFeed as message}
                            {#if message}
                                <UserDisplay
                                    link={getFeedUrl(
                                        message.type,
                                        message.username,
                                        message.content,
                                    )}
                                    userLink={`/profile?user=${message.username}`}
                                    text={getFeedText(
                                        message.type,
                                        message.username,
                                        message.content,
                                    )}
                                    author={message.username}
                                    image={`https://trampoline.turbowarp.org/avatars/by-username/${message.username}`}
                                />
                            {/if}
                        {/each}
                    {:else if feedIsEmpty}
                        <PenguinConfusedSVG width="6rem" />
                        <p>
                            <LocalizedText
                                text="Nothing was found."
                                key="generic.notfound"
                                lang={currentLang}
                            />
                        </p>
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
            </ContentCategory>
        {:else if !loggedIn || selectedFrontTabSelected === "commit"}
            <ContentCategory
                header={TranslationHandler.text(
                    "home.sections.githubcommits",
                    currentLang,
                )}
                seemore={LINK.github}
            >
                <div class="category-content">
                    {#if ghcommits.length > 0}
                        {#each ghcommits as commit}
                            {#if commit}
                                <UserDisplay
                                    link={commit.html_url}
                                    userLink={commit.author
                                        ? commit.author.html_url
                                        : ""}
                                    text={censor(commit.commit.message)}
                                    author={commit.author
                                        ? commit.author.login
                                        : ""}
                                    image={commit.author
                                        ? commit.author.avatar_url
                                        : ""}
                                />
                            {/if}
                        {/each}
                    {:else if ghcommitsFailed}
                        <p>
                            <LocalizedText
                                text="Failed to load commits."
                                key="home.sections.githubcommits.failed.generic"
                                lang={currentLang}
                            />
                        </p>
                    {:else if ghcommitsLoaded}
                        <p style="text-align: center;">
                            <LocalizedText
                                text="GitHub failed to provide commits. Please try again later."
                                key="home.sections.githubcommits.failed.provide"
                                lang={currentLang}
                            />
                        </p>
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
            </ContentCategory>
        {:else if loggedIn && selectedFrontTabSelected === "new"}
            <ContentCategory header={"What Snails I'm Following are Doing"}>
                <div class="category-content">
                    <div class="category-content">
                        {#if myFeed.length > 0}
                            {#each myFeed as activity}
                                <!-- {#if commit}
                                    <UserDisplay
                                        link={commit.html_url}
                                        userLink={commit.author
                                            ? commit.author.html_url
                                            : ""}
                                        text={censor(commit.commit.message)}
                                        author={commit.author
                                            ? commit.author.login
                                            : ""}
                                        image={commit.author
                                            ? commit.author.avatar_url
                                            : ""}
                                    />
                                {/if} -->
                            {/each}
                        {/if}
                    </div>
                </div>
            </ContentCategory>
        {/if}
    </div>
    {#if loggedIn}
        <div class="section-category-toggles">
            <div class="category-toggle-section" />
            <div class="category-toggle-section">
                <button
                    class="section-toggle-button"
                    data-active={selectedFrontTabSelected === "new"}
                    on:click={() => {
                        selectedFrontTabSelected = "new";
                    }}
                >
                    Shopping List
                </button>
                <button
                    class="section-toggle-button"
                    data-active={selectedFrontTabSelected === "commit"}
                    on:click={() => {
                        selectedFrontTabSelected = "commit";
                    }}
                >
                    <LocalizedText
                        text="Recent commits"
                        key="home.sections.githubcommits"
                        lang={currentLang}
                    />
                </button>
            </div>
        </div>
    {/if}

    <div class="section-projects">
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.weeklyfeatured",
                currentLang,
            )}
            seemore={`/search?q=featured%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;"
        >
            <div class="project-list">
                {#if projects.featured.length > 0}
                    {#each projects.featured as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsLoaded === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <PenguinConfusedSVG width="8rem" />
                        <p>
                            <LocalizedText
                                text="Nothing found. You can help feature projects by clicking the yellow checkmark below them."
                                key="home.none.featured"
                                lang={currentLang}
                            />
                        </p>
                    </div>
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <img
                            src="/penguins/server.svg"
                            alt="Server Penguin"
                            style="width: 15rem"
                        />
                        <p>
                            <LocalizedText
                                text="Whoops! Our server's having some problems. Try again later. Or if you're on a school computer, https://snailshare.dreamhosters.com may be blocked. You can still make a project."
                                key="home.server.error"
                                lang={currentLang}
                            />
                            <Button link={LINK.editor}>
                                <LocalizedText
                                    text="Create a project"
                                    key="home.footer.sections.website.createAProject"
                                    lang={currentLang}
                                />
                            </Button>
                        </p>
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.todaysprojects",
                currentLang,
            )}
            seemore={`/search?q=all%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;"
        >
            <div class="project-list">
                {#if projects.today.length > 0}
                    {#each projects.today as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <img
                            src="/penguins/server.svg"
                            alt="Server Penguin"
                            style="width: 15rem"
                        />
                        <p>
                            <LocalizedText
                                text="Whoops! Our server's having some problems. Try again later. Or if you're on a school computer, https://snailshare.dreamhosters.com may be blocked. You can still make a project."
                                key="home.server.error"
                                lang={currentLang}
                            />
                            <Button link={LINK.editor}>
                                <LocalizedText
                                    text="Create a project"
                                    key="home.footer.sections.website.createAProject"
                                    lang={currentLang}
                                />
                            </Button>
                        </p>
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        {#if isItAprilFoolDay()}
            <img src="https://penguinmod.com/cat/dave.png" alt="dave" />
        {/if}
        {#if isItSpooky()}
            <img src="https://snail-ide.com/pumpkin.png" alt="pumpkin" />
        {/if}
    </div>

    <div class="footer">
        <p>
            <!-- {#if !thingyActive} -->
            Snail IDE is not affiliated with PenguinMod, Scratch, TurboWarp, the
            Scratch Team, or any other Scratch Modifications.
            <!-- todo: find a better place to put this that isn't, the legal text -->
            <!-- {:else}
                EEAAOO EEAAOOEEAAOOEEAAOOEEAAOOEEAAOOEEAAOO EEAAOO
                EEAAOOEEAAOOEEAAOO EEAAOO
            {/if} -->
        </p>
        <div class="footer-list">
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Website"
                        key="home.footer.sections.website"
                        lang={currentLang}
                    />
                </p>
                <a href={LINK.editor}>
                    <LocalizedText
                        text="Editor"
                        key="home.footer.sections.website.editor"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.credits}>
                    <LocalizedText
                        text="Credits"
                        key="home.footer.sections.website.credits"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.github}>
                    <LocalizedText
                        text="Source"
                        key="home.footer.sections.website.source"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.packager}>
                    <LocalizedText
                        text="Packager"
                        key="home.footer.sections.website.packager"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>Community</p>
                <a
                    target="_blank"
                    href="https://scratch.mit.edu/studios/33532977/"
                >
                    Snail IDE Scratch Studio
                </a>
                <a
                    target="_blank"
                    href="https://docs.google.com/forms/d/e/1FAIpQLSd50Sx8FpGS0rucyFFUR3TrcumGpJJJZtKDrn8Hq7FYpKJiWA/viewform"
                >
                    Snail IDE Feedback
                </a>
                <a
                    target="_blank"
                    href="https://opensnail.snail-ide.com/tempshare.html"
                >
                    Temp Share
                </a>
                <a
                    target="_blank"
                    href="https://snailide.miraheze.org/wiki/Main_Page"
                >
                    Wiki
                </a>
                <a target="_blank" href="/forum"> Unofficial Forum </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Info"
                        key="home.footer.sections.info"
                        lang={currentLang}
                    />
                </p>
                <a target="_blank" href={LINK.terms}> Terms of Service </a>
                <a target="_blank" href={LINK.privacy}> Privacy Policy </a>
                <a target="_blank" href={"/guidelines/uploading"}>
                    Project Rules
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Donate"
                        key="home.footer.sections.donate"
                        lang={currentLang}
                    />
                </p>
                <a href={"https://penguinmod.com/donate"}>PenguinMod</a>
                <a target="_blank" href={"https://docs.turbowarp.org/donate"}
                    >TurboWarp</a
                >
                <a
                    target="_blank"
                    href={"https://www.scratchfoundation.org/donate"}>Scratch</a
                >
            </div>
        </div>
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 24px 0px 48px;
        border-top: rgba(0, 0, 0, 0.3) 1px solid;
        background: rgba(195, 0, 255, 0.281);
        font-weight: bold;
        margin-top: 4px;
        /* border-top-left-radius: 20%; */
        /* border-top-right-radius: 20%; */
    }
    .footer a {
        color: rgb(0, 0, 0);
        font-weight: bold;
        margin: 2px 0px;
    }
    .footer a:active {
        color: rgb(0, 0, 0);
    }
    .footer-list {
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }
    .footer-section {
        display: flex;
        flex-direction: column;
        margin: 0px 32px;
        font-size: 14px;
    }
    :global(body.dark-mode) .footer {
        /* border-top: rgba(255, 255, 255, 0.1) 1px solid; */
        border-top: rgba(255, 255, 255, 0.3) 1px solid;
        /* background: transparent; */
        /* background: #0059ff15; */
        /* border-top-left-radius: 20%; */
        /* border-top-right-radius: 20%; */
    }

    .main {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        min-width: 1000px;
    }
    :global(body.dark-mode) .main {
        color: white;
    }

    .section-info {
        background: #7601b4;
        background: linear-gradient(225deg, #8900d3, #270057);
        height: 24rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    :global(html[dir="rtl"]) .section-info {
        justify-content: space-around;
    }
    .section-links {
        background: #d400ff28;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0.5rem 0;
        margin: 0px;
    }

    .section-categories {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-category-toggles {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .category-toggle-section {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 30%;
        margin: 4px 10px;
    }
    .section-toggle-button {
        border-radius: 1024px;
        padding: 4px 10px;
        background: #008cff;
        font-weight: bold;
        font-size: 1em;
        border: 0;
        margin: 0 4px;
        color: white;
        cursor: pointer;
    }
    .section-toggle-button[data-active="true"] {
        background: #003bdd;
    }

    .profile-picture {
        width: 72px;
        height: 72px;
        border-radius: 4px;
    }
    .welcome-back-card {
        width: 30%;
        height: 312px;
        margin: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .welcome-back-row {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .welcome-back-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent;
        border: 0;
        cursor: pointer;
    }
    :global(body.dark-mode) .welcome-back-button {
        color: white;
    }
    .welcome-back-no-underline {
        text-decoration: none;
    }
    .welcome-back-icon-container {
        border: 1px solid rgba(0, 0, 0, 0.25);
        background: transparent;
        border-radius: 1024px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        margin-bottom: 4px;
    }
    :global(body.dark-mode) .welcome-back-icon-container {
        border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .welcome-back-button:active .welcome-back-icon-container {
        background: rgba(0, 0, 0, 0.2);
    }
    :global(body.dark-mode)
        .welcome-back-button:active
        .welcome-back-icon-container {
        background: rgba(255, 255, 255, 0.2);
    }
    .welcome-back-icon-container img {
        width: 32px;
        height: 32px;
        filter: brightness(0.2);
    }
    :global(body.dark-mode) .welcome-back-icon-container img {
        filter: brightness(1);
    }

    .section-projects {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-language-warning {
        background: #ffd00073;
        color: black;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-size: 18px;
        font-weight: bold;
        margin: 0px;
        text-align: center;
    }
    .section-language-warning > img {
        filter: brightness(0);
    }
    :global(body.dark-mode) .section-language-warning {
        color: white;
    }
    :global(body.dark-mode) .section-language-warning > img {
        filter: brightness(1);
    }

    .example-video {
        border-radius: 6px;
        outline-style: solid;
        outline-width: 6px;
        outline-color: rgba(255, 255, 255, 0.35);
        margin-right: 8rem;
    }

    .category-content {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .update-image {
        width: 100%;
        height: 100%;
    }
    .update-image-wrapper {
        background: transparent;
        cursor: pointer;
        margin-top: 4px;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: 0;
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }

    /* test styles, remove later */
    .vr-test-button {
        padding: 20px;
        margin: 4px;
        font-size: larger;
    }
</style>
