<?php

namespace App\Modelos\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope("tenant", function (Builder $builder) {
            if (!app()->bound("tenant")) {
                return;
            }

            $tenant = app("tenant");
            $builder->where($builder->getModel()->getTable().".tenant_id", $tenant->id);
        });

        static::creating(function ($model) {
            if (!app()->bound("tenant")) {
                return;
            }

            if (empty($model->tenant_id)) {
                $model->tenant_id = app("tenant")->id;
            }
        });
    }
}
