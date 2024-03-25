<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContactController;

Route::middleware(["throttle:api"])->group(function () {
    Route::post("contact", [ContactController::class, "contact"])
        ->name("contact");
});