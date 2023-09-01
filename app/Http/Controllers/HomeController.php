<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function home(Request $request) {
        $darkMode = null;
        if (
            $request->has("darkMode") && 
            $request->query("darkMode") === "on"
        ) {
            $darkMode = "on";
        }
        return view('pages.index', compact("darkMode"));
    }
}
