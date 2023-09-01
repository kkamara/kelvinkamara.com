<x-mail::message>

<x-mail::panel>
<div>
    <p><strong>Name:</strong></p>
    <p>{{ $name }}</p>
</div>
<br />
<div>
    <p><strong>Email:</strong></p>
    <p>{{ $email }}</p>
</div>
<br />
<div>
    <p><strong>Message:</strong></p>
    <p>{{ $message }}</p>
</div>
</x-mail::panel>

<div>
    Thanks,<br>
    {{ config('app.name') }}
</div>
</x-mail::message>
