<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <title>{{ config("app.name") }} - Award Winning Software Engineer</title>
    <meta name="HandheldFriendly" content="True"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="keywords" content="Award Winning, Build, Websites, Web Apps, Mobile Apps, Desktop Apps"/>
    <meta name="author" content="Kelvin Kamara"/>
    <meta name="title" content="Kelvin Kamara - Award Winning Software Engineer"/>
    <meta name="description" content="Kelvin Kamara has over 10 years competency in both frontend & backend systems. Specializing in backend technologies, Kelvin has achieved a UK Government award for his works on secure web systems."/>
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('img/favicon.ico') }}"/>
    <link rel="stylesheet" href="{{ asset('css/theme.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/bootstrap.min.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/all.min.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/custom.css') }}"/>
    <link rel="stylesheet" href="{{ asset('css/modal-styles.css') }}"/>
    <link href="{{ asset('css/font-awesome.min.css') }}"/>
    @if($darkMode !== null && $darkMode === "on")
      <link rel="stylesheet" href="{{ asset('css/dark-theme.css') }}"/>
    @endif
</head>  
<body id="top">
    <div class="site-wrapper">
        @include("layouts.partials.header")
        @section("content") @show
    </div>

    <footer class="site-footer">
        <p>
            <span>
              {{ config("app.name") }} © 2024
            </span>
            <a 
                href="https://github.com/kkamara" 
                style="outline: none;"
                class="header-icon-container"
            >
                <i 
                    class="fab fa-github-square fa-3x header-icon"
                    style="margin-left: 2.5px; margin-right 10px;"
                ></i>
            </a>
            <a 
                href="https://www.linkedin.com/in/kelvin-kamara-2ab84629b/" 
                style="outline: none;"
                class="header-icon-container"
            >
                <i 
                    class="fab fa-linkedin fa-3x header-icon"
                    style="margin-left: 2.5px; margin-right 10px;"
                ></i>
            </a>
            @if($darkMode !== null && $darkMode === "on")
                <a href="/">
                    <i class="fas fa-toggle-on fa-3x"></i>
                </a>
            @else
              <a href="/?darkMode=on">
                  <i class="fas fa-toggle-off fa-3x"></i>
              </a>
            @endif
        </p>
    </footer>
    @include("layouts.partials.scripts")
</body>