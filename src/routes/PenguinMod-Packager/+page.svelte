<script>
    import { onMount } from "svelte";
    onMount(() => {
        window.location.href =
            "https://snail-ide.js.org/Snail-IDE-Packager";
    });
</script>

<head>
    <title>Redirecting</title>
</head>
<div>
    If you are not redirected automatically,
    <a href="https://snail-ide.js.org/Snail-IDE-Packager">click here</a>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: white;
    }

    a {
        margin-left: 4px;
    }

    div {
        background: #009ccc;
        display: flex;
        align-items: center;
        height: 100%;
        width: 100%;
        position: absolute;
        left: 0px;
        top: 0px;
        overflow: hidden;
        justify-content: center;
    }
</style>
