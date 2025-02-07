<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function home(Request $request) {
        $darkMode = null;
        if (
            true === $request->has("darkMode") && 
            $request->query("darkMode") === "on"
        ) {
            $darkMode = "on";
        } else {
            $darkMode = "off";
        }
        return view('pages.index', compact("darkMode"));
    }
}
