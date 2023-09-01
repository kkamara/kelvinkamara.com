@extends("layouts.main")

@section("content")
    @include("layouts.partials.hero")
    <div class="container">
        <div class="row">
            @include("layouts.partials.pub-card")
        </div>
    </div>
    @include("layouts.partials.featured-slider")
    <div class="container">
        <div class="row">
            <div class="col-md-12">
                @include("layouts.partials.loop")
            </div>
        </div>
    </div>
@stop