param(
    [string]$EnvPath = ".env"
)

$ErrorActionPreference = "Stop"

function Get-EnvValue {
    param(
        [string]$Path,
        [string]$Key
    )

    if (-not (Test-Path $Path)) {
        throw "Could not find $Path. Create it from the README before running this script."
    }

    $line = Get-Content -Path $Path | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $line) {
        throw "Missing $Key in $Path."
    }

    return ($line -replace "^$Key=", "").Trim()
}

function Parse-DatabaseUrl {
    param(
        [string]$DatabaseUrl
    )

    if ($DatabaseUrl -notmatch '^mysql\+pymysql://(?<user>[^:]+):(?<password>[^@]*)@(?<host>[^:/]+)(:(?<port>\d+))?/(?<database>[^?]+)$') {
        throw "DATABASE_URL must use the mysql+pymysql://user:password@host:port/database format."
    }

    return [pscustomobject]@{
        User     = [uri]::UnescapeDataString($Matches.user)
        Password = [uri]::UnescapeDataString($Matches.password)
        Host     = [uri]::UnescapeDataString($Matches.host)
        Port     = if ($Matches.port) { [int]$Matches.port } else { 3306 }
        Database = [uri]::UnescapeDataString($Matches.database)
    }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFilePath = Join-Path $repoRoot $EnvPath
$databaseUrl = Get-EnvValue -Path $envFilePath -Key "DATABASE_URL"
$database = Parse-DatabaseUrl -DatabaseUrl $databaseUrl

$mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCommand) {
    throw "MySQL client 'mysql' was not found in PATH. Install MySQL client tools or add mysql.exe to PATH."
}

$schemaFiles = @(
    "users.sql",
    "departments.sql",
    "user_profiles.sql",
    "employment_history.sql",
    "attendance_records.sql",
    "leave_requests.sql",
    "position_change_requests.sql",
    "profile_documents.sql",
    "training_sessions.sql",
    "training_registrations.sql",
    "audit_logs.sql"
)

$previousMysqlPwd = $env:MYSQL_PWD
try {
    $env:MYSQL_PWD = $database.Password

    foreach ($schemaFile in $schemaFiles) {
        $schemaPath = Join-Path $repoRoot ("database_schema\" + $schemaFile)
        if (-not (Test-Path $schemaPath)) {
            throw "Missing schema file: $schemaPath"
        }

        Write-Host "Importing $schemaFile into $($database.Database)..."
        Get-Content -Raw -Path $schemaPath | & $mysqlCommand.Source --host=$($database.Host) --port=$($database.Port) --user=$($database.User) $($database.Database)

        if ($LASTEXITCODE -ne 0) {
            throw "Import failed for $schemaFile. Fix the error above and run the script again."
        }
    }

    Write-Host "Schema import completed successfully."
}
finally {
    $env:MYSQL_PWD = $previousMysqlPwd
}