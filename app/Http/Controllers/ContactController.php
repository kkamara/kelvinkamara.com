<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Mail\ContactForm;

class ContactController extends Controller
{
    public function contact(Request $request) {
        $validator = Validator::make(
            $request->all(),
            [
                "name" => "required|min:3|max:30",
                "email" => "required|min:3|max:30|email:rfc",
                "message" => "max:255",
            ]
        );
        if ($validator->fails()) {
            return response()->json($validator->errors(), Response::HTTP_BAD_REQUEST);
        }
        $name = htmlspecialchars($request->get("name"));
        $email = htmlspecialchars($request->get("email"));
        $message = htmlspecialchars($request->get("message"));
        Mail::to(config("mail.to_address"))->send(new ContactForm(
            $name,
            $email,
            $message
        ));
        return response()->json([ "message" => "Success" ]);
    }
}
