<x-mail::message>

<x-mail::panel>
<div>
    <p>Name:</p>
    <p>{{ $name }}</p>
</div>
<div>
    <p>Email:</p>
    <p>{{ $email }}</p>
</div>
<div>
    <p>Message:</p>
    <p>{{ $message }}</p>
</div>
</x-mail::panel>

<div>
    Thanks,<br>
    {{ config('app.name') }}
</div>
</x-mail::message>
